import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';

const execAsync = promisify(exec);

/**
 * Automated Backup Service
 * 
 * Handles automated database backups with:
 * - Scheduled backups (daily, weekly, monthly)
 * - Backup retention policies
 * - Backup verification
 * - Backup restoration
 */
@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;
  private readonly databaseUrl: string;
  private readonly retentionDays: number;
  private readonly retentionWeeks: number;
  private readonly retentionMonths: number;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.backupDir = this.configService.get<string>('BACKUP_DIR') || './backups';
    this.databaseUrl = this.configService.get<string>('DATABASE_URL') || '';
    this.retentionDays = parseInt(this.configService.get<string>('BACKUP_RETENTION_DAILY') || '7', 10);
    this.retentionWeeks = parseInt(this.configService.get<string>('BACKUP_RETENTION_WEEKLY') || '4', 10);
    this.retentionMonths = parseInt(this.configService.get<string>('BACKUP_RETENTION_MONTHLY') || '12', 10);

    // Ensure backup directory exists
    this.ensureBackupDirectory();
  }

  /**
   * Create a database backup
   */
  async createBackup(type: 'daily' | 'weekly' | 'monthly' | 'manual' = 'manual'): Promise<{
    success: boolean;
    filename: string;
    path: string;
    size: number;
    timestamp: Date;
  }> {
    try {
      await this.ensureBackupDirectory();

      const timestamp = new Date();
      const dateStr = timestamp.toISOString().replace(/[:.]/g, '-').split('T')[0];
      const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `backup-${type}-${dateStr}-${timeStr}.sql`;
      const filepath = join(this.backupDir, filename);

      // Extract database connection details from DATABASE_URL
      const dbUrl = new URL(this.databaseUrl);
      const dbName = dbUrl.pathname.slice(1);
      const dbHost = dbUrl.hostname;
      const dbPort = dbUrl.port || '5432';
      const dbUser = dbUrl.username;
      const dbPassword = dbUrl.password;

      // Create backup using pg_dump
      // Note: -F c creates a custom format, -f specifies output file
      // For custom format, the filepath should be a directory or file without extension
      const pgDumpCommand = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f "${filepath}"`;

      this.logger.log(`Creating ${type} backup: ${filename}`);
      await execAsync(pgDumpCommand);

      // Get file size
      const stats = await stat(filepath);
      const size = stats.size;

      // Verify backup file exists and has content
      if (size === 0) {
        throw new Error('Backup file is empty');
      }

      this.logger.log(`Backup created successfully: ${filename} (${this.formatBytes(size)})`);

      return {
        success: true,
        filename,
        path: filepath,
        size,
        timestamp,
      };
    } catch (error) {
      this.logger.error(`Failed to create backup: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(filepath: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verify backup file exists
      const stats = await stat(filepath);
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      const dbUrl = new URL(this.databaseUrl);
      const dbName = dbUrl.pathname.slice(1);
      const dbHost = dbUrl.hostname;
      const dbPort = dbUrl.port || '5432';
      const dbUser = dbUrl.username;
      const dbPassword = dbUrl.password;

      // Restore backup using pg_restore
      const pgRestoreCommand = `PGPASSWORD="${dbPassword}" pg_restore -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c "${filepath}"`;

      this.logger.log(`Restoring backup: ${filepath}`);
      await execAsync(pgRestoreCommand);

      this.logger.log('Backup restored successfully');

      return {
        success: true,
        message: 'Database restored successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to restore backup: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * List all backups
   */
  async listBackups(): Promise<Array<{
    filename: string;
    path: string;
    size: number;
    createdAt: Date;
    type: string;
  }>> {
    try {
      await this.ensureBackupDirectory();
      const files = await readdir(this.backupDir);
      const backups: Array<{ filename: string; path: string; size: number; createdAt: Date; type: string }> = [];

      for (const file of files) {
        if (file.endsWith('.sql')) {
          const filepath = join(this.backupDir, file);
          const stats = await stat(filepath);
          const type = this.extractBackupType(file);

          backups.push({
            filename: file,
            path: filepath,
            size: stats.size,
            createdAt: stats.birthtime,
            type,
          });
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return backups;
    } catch (error) {
      this.logger.error(`Failed to list backups: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete old backups based on retention policy
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldBackups(): Promise<void> {
    try {
      this.logger.log('Starting backup cleanup...');
      const backups = await this.listBackups();
      const now = new Date();
      let deletedCount = 0;

      for (const backup of backups) {
        const age = now.getTime() - backup.createdAt.getTime();
        const ageDays = age / (1000 * 60 * 60 * 24);

        let shouldDelete = false;

        if (backup.type === 'daily' && ageDays > this.retentionDays) {
          shouldDelete = true;
        } else if (backup.type === 'weekly' && ageDays > this.retentionWeeks * 7) {
          shouldDelete = true;
        } else if (backup.type === 'monthly' && ageDays > this.retentionMonths * 30) {
          shouldDelete = true;
        } else if (backup.type === 'manual' && ageDays > this.retentionDays) {
          // Manual backups follow daily retention
          shouldDelete = true;
        }

        if (shouldDelete) {
          await unlink(backup.path);
          deletedCount++;
          this.logger.log(`Deleted old backup: ${backup.filename}`);
        }
      }

      this.logger.log(`Backup cleanup completed. Deleted ${deletedCount} old backups.`);
    } catch (error) {
      this.logger.error(`Failed to cleanup backups: ${error.message}`, error.stack);
    }
  }

  /**
   * Scheduled daily backup
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async scheduledDailyBackup(): Promise<void> {
    try {
      this.logger.log('Starting scheduled daily backup...');
      await this.createBackup('daily');
    } catch (error) {
      this.logger.error(`Scheduled daily backup failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Scheduled weekly backup (Sunday at 2 AM)
   */
  @Cron('0 2 * * 0')
  async scheduledWeeklyBackup(): Promise<void> {
    try {
      this.logger.log('Starting scheduled weekly backup...');
      await this.createBackup('weekly');
    } catch (error) {
      this.logger.error(`Scheduled weekly backup failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Scheduled monthly backup (1st of month at 1 AM)
   */
  @Cron('0 1 1 * *')
  async scheduledMonthlyBackup(): Promise<void> {
    try {
      this.logger.log('Starting scheduled monthly backup...');
      await this.createBackup('monthly');
    } catch (error) {
      this.logger.error(`Scheduled monthly backup failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    dailyBackups: number;
    weeklyBackups: number;
    monthlyBackups: number;
    manualBackups: number;
    oldestBackup?: Date;
    newestBackup?: Date;
  }> {
    const backups = await this.listBackups();
    const stats = {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, b) => sum + b.size, 0),
      dailyBackups: backups.filter((b) => b.type === 'daily').length,
      weeklyBackups: backups.filter((b) => b.type === 'weekly').length,
      monthlyBackups: backups.filter((b) => b.type === 'monthly').length,
      manualBackups: backups.filter((b) => b.type === 'manual').length,
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].createdAt : undefined,
      newestBackup: backups.length > 0 ? backups[0].createdAt : undefined,
    };

    return stats;
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await execAsync(`mkdir -p "${this.backupDir}"`);
    } catch (error) {
      // Directory might already exist, ignore error
    }
  }

  /**
   * Extract backup type from filename
   */
  private extractBackupType(filename: string): string {
    if (filename.includes('-daily-')) return 'daily';
    if (filename.includes('-weekly-')) return 'weekly';
    if (filename.includes('-monthly-')) return 'monthly';
    return 'manual';
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

