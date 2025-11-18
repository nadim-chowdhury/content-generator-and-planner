import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

/**
 * PostgreSQL Point-in-Time Recovery (PITR) Service
 * 
 * Handles PostgreSQL WAL archiving and point-in-time recovery:
 * - WAL archiving configuration
 * - Base backup creation
 * - PITR recovery to specific timestamp
 * - WAL file management
 */
@Injectable()
export class PitrService {
  private readonly logger = new Logger(PitrService.name);
  private readonly walArchiveDir: string;
  private readonly baseBackupDir: string;
  private readonly databaseUrl: string;
  private readonly pgDataDir: string;

  constructor(private configService: ConfigService) {
    this.walArchiveDir = this.configService.get<string>('PITR_WAL_ARCHIVE_DIR') || './backups/wal_archive';
    this.baseBackupDir = this.configService.get<string>('PITR_BASE_BACKUP_DIR') || './backups/base_backups';
    this.databaseUrl = this.configService.get<string>('DATABASE_URL') || '';
    this.pgDataDir = this.configService.get<string>('PGDATA') || '/var/lib/postgresql/data';

    // Ensure directories exist
    this.ensureDirectories();
  }

  /**
   * Generate PostgreSQL configuration for PITR
   */
  async generatePitrConfig(): Promise<{
    postgresqlConf: string;
    recoveryConf: string;
    instructions: string[];
  }> {
    const postgresqlConf = `
# Point-in-Time Recovery Configuration
# Add these settings to your postgresql.conf

# Enable WAL archiving
wal_level = replica
archive_mode = on
archive_command = 'test ! -f ${this.walArchiveDir}/%f && cp %p ${this.walArchiveDir}/%f'
archive_timeout = 300  # Force archive every 5 minutes

# WAL settings for PITR
max_wal_senders = 3
wal_keep_size = 1GB

# Recovery settings (for recovery.conf or postgresql.auto.conf)
# restore_command = 'cp ${this.walArchiveDir}/%f %p'
# recovery_target_time = 'YYYY-MM-DD HH:MM:SS'  # Set when recovering
# recovery_target_action = 'promote'
    `.trim();

    const recoveryConf = `
# Recovery Configuration
# Place this in recovery.conf or postgresql.auto.conf when recovering

restore_command = 'cp ${this.walArchiveDir}/%f %p'
recovery_target_time = ''  # Set to specific timestamp for PITR
recovery_target_action = 'promote'
    `.trim();

    const instructions = [
      '1. Add the postgresql.conf settings to your PostgreSQL configuration file',
      '2. Restart PostgreSQL server',
      '3. Create base backups regularly using createBaseBackup()',
      '4. WAL files will be automatically archived to the archive directory',
      '5. To recover, restore a base backup and configure recovery.conf',
      '6. Use recoverToTimestamp() to recover to a specific point in time',
    ];

    return {
      postgresqlConf,
      recoveryConf,
      instructions,
    };
  }

  /**
   * Create a base backup for PITR
   */
  async createBaseBackup(): Promise<{
    success: boolean;
    backupPath: string;
    timestamp: Date;
    walLocation: string;
  }> {
    try {
      await this.ensureDirectories();

      const timestamp = new Date();
      const dateStr = timestamp.toISOString().replace(/[:.]/g, '-').split('T')[0];
      const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
      const backupPath = join(this.baseBackupDir, `base_backup_${dateStr}_${timeStr}`);

      const dbUrl = new URL(this.databaseUrl);
      const dbHost = dbUrl.hostname;
      const dbPort = dbUrl.port || '5432';
      const dbUser = dbUrl.username;
      const dbPassword = dbUrl.password;

      // Create base backup using pg_basebackup
      const pgBasebackupCommand = `PGPASSWORD="${dbPassword}" pg_basebackup -h ${dbHost} -p ${dbPort} -U ${dbUser} -D "${backupPath}" -Ft -z -P`;

      this.logger.log(`Creating base backup: ${backupPath}`);
      const { stdout } = await execAsync(pgBasebackupCommand);

      // Extract WAL location from output
      const walLocationMatch = stdout.match(/wal location: ([0-9A-F\/]+)/i);
      const walLocation = walLocationMatch ? walLocationMatch[1] : 'unknown';

      // Save backup metadata
      const metadata = {
        timestamp: timestamp.toISOString(),
        walLocation,
        backupPath,
        type: 'base_backup',
      };

      await writeFile(
        join(backupPath, 'backup_metadata.json'),
        JSON.stringify(metadata, null, 2),
      );

      this.logger.log(`Base backup created successfully: ${backupPath}`);

      return {
        success: true,
        backupPath,
        timestamp,
        walLocation,
      };
    } catch (error) {
      this.logger.error(`Failed to create base backup: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Recover database to a specific point in time
   */
  async recoverToTimestamp(
    backupPath: string,
    targetTimestamp: Date,
  ): Promise<{
    success: boolean;
    recoveryScript: string;
    instructions: string[];
  }> {
    try {
      // Verify backup exists
      if (!existsSync(backupPath)) {
        throw new Error(`Backup path does not exist: ${backupPath}`);
      }

      // Read backup metadata
      const metadataPath = join(backupPath, 'backup_metadata.json');
      let metadata: any = {};
      if (existsSync(metadataPath)) {
        const metadataContent = await readFile(metadataPath, 'utf-8');
        metadata = JSON.parse(metadataContent);
      }

      // Generate recovery script
      const recoveryScript = this.generateRecoveryScript(backupPath, targetTimestamp);

      const instructions = [
        '1. Stop PostgreSQL server',
        '2. Backup current PostgreSQL data directory',
        `3. Restore base backup from: ${backupPath}`,
        '4. Create recovery.conf file with the generated configuration',
        '5. Ensure WAL archive directory is accessible',
        '6. Start PostgreSQL server',
        '7. PostgreSQL will automatically recover to the target timestamp',
        '8. Once recovery is complete, remove recovery.conf',
      ];

      return {
        success: true,
        recoveryScript,
        instructions,
      };
    } catch (error) {
      this.logger.error(`Failed to generate recovery plan: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * List available base backups
   */
  async listBaseBackups(): Promise<Array<{
    path: string;
    timestamp: Date;
    walLocation: string;
    size: number;
  }>> {
    try {
      await this.ensureDirectories();

      if (!existsSync(this.baseBackupDir)) {
        return [];
      }

      // List base backup directories
      const { stdout } = await execAsync(`ls -d ${this.baseBackupDir}/base_backup_* 2>/dev/null || true`);
      const directories = stdout.trim().split('\n').filter((d: string) => d);

      const backups: Array<{ path: string; timestamp: Date; walLocation: any; size: number }> = [];

      for (const dir of directories) {
        const metadataPath = join(dir, 'backup_metadata.json');
        if (existsSync(metadataPath)) {
          const metadataContent = await readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metadataContent);

          // Get directory size
          const { stdout: sizeOutput } = await execAsync(
            `du -sb "${dir}" 2>/dev/null | cut -f1 || echo "0"`,
          );
          const size = parseInt(sizeOutput.trim(), 10);

          backups.push({
            path: dir,
            timestamp: new Date(metadata.timestamp),
            walLocation: metadata.walLocation || 'unknown',
            size,
          });
        }
      }

      // Sort by timestamp (newest first)
      backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return backups;
    } catch (error) {
      this.logger.error(`Failed to list base backups: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Get WAL archive statistics
   */
  async getWalArchiveStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    oldestFile?: Date;
    newestFile?: Date;
  }> {
    try {
      await this.ensureDirectories();

      if (!existsSync(this.walArchiveDir)) {
        return {
          totalFiles: 0,
          totalSize: 0,
        };
      }

      // Count WAL files and get total size
      const { stdout: fileList } = await execAsync(
        `find "${this.walArchiveDir}" -name "*.wal" -o -name "*[0-9A-F][0-9A-F]" 2>/dev/null | head -1000 || true`,
      );
      const files = fileList.trim().split('\n').filter((f: string) => f);

      const { stdout: sizeOutput } = await execAsync(
        `du -sb "${this.walArchiveDir}" 2>/dev/null | cut -f1 || echo "0"`,
      );
      const totalSize = parseInt(sizeOutput.trim(), 10);

      return {
        totalFiles: files.length,
        totalSize,
      };
    } catch (error) {
      this.logger.error(`Failed to get WAL archive stats: ${error.message}`, error.stack);
      return {
        totalFiles: 0,
        totalSize: 0,
      };
    }
  }

  /**
   * Generate recovery script
   */
  private generateRecoveryScript(backupPath: string, targetTimestamp: Date): string {
    const timestampStr = targetTimestamp.toISOString().replace('T', ' ').substring(0, 19);

    return `
# PostgreSQL Point-in-Time Recovery Script
# Target Timestamp: ${timestampStr}

# 1. Stop PostgreSQL
sudo systemctl stop postgresql
# OR: pg_ctl stop -D ${this.pgDataDir}

# 2. Backup current data directory (optional but recommended)
sudo cp -r ${this.pgDataDir} ${this.pgDataDir}.backup.$(date +%Y%m%d_%H%M%S)

# 3. Remove current data directory contents
sudo rm -rf ${this.pgDataDir}/*

# 4. Restore base backup
sudo tar -xzf ${backupPath}/base.tar.gz -C ${this.pgDataDir}
sudo tar -xzf ${backupPath}/pg_wal.tar.gz -C ${this.pgDataDir}/pg_wal 2>/dev/null || true

# 5. Create recovery.conf
cat > ${this.pgDataDir}/recovery.conf << EOF
restore_command = 'cp ${this.walArchiveDir}/%f %p'
recovery_target_time = '${timestampStr}'
recovery_target_action = 'promote'
EOF

# 6. Set proper permissions
sudo chown -R postgres:postgres ${this.pgDataDir}
sudo chmod 700 ${this.pgDataDir}

# 7. Start PostgreSQL
sudo systemctl start postgresql
# OR: pg_ctl start -D ${this.pgDataDir}

# 8. Monitor recovery progress
sudo tail -f ${this.pgDataDir}/log/postgresql-*.log

# 9. Once recovery is complete, remove recovery.conf
# sudo rm ${this.pgDataDir}/recovery.conf
    `.trim();
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await mkdir(this.walArchiveDir, { recursive: true });
      await mkdir(this.baseBackupDir, { recursive: true });
    } catch (error) {
      // Directories might already exist
    }
  }
}

