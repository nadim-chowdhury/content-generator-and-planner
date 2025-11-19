import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DdosProtectionService } from './services/ddos-protection.service';
import { BackupService } from './services/backup.service';
import { PitrService } from './services/pitr.service';

@Controller('api/infrastructure')
@UseGuards(JwtAuthGuard)
export class InfrastructureController {
  constructor(
    private ddosProtectionService: DdosProtectionService,
    private backupService: BackupService,
    private pitrService: PitrService,
  ) {}

  // DDOS Protection Endpoints
  @Get('ddos/stats')
  getDdosStats() {
    return this.ddosProtectionService.getProtectionStats();
  }

  @Get('ddos/ip/:ip')
  async getIPStatistics(@Param('ip') ip: string) {
    return this.ddosProtectionService.getIPStatistics(ip);
  }

  @Post('ddos/block/:ip')
  async blockIP(@Param('ip') ip: string, @Body('reason') reason?: string) {
    await this.ddosProtectionService.blockIP(ip, reason || 'Manual block');
    return { message: `IP ${ip} blocked successfully` };
  }

  @Post('ddos/unblock/:ip')
  async unblockIP(@Param('ip') ip: string) {
    await this.ddosProtectionService.unblockIP(ip);
    return { message: `IP ${ip} unblocked successfully` };
  }

  // Backup Endpoints
  @Post('backups/create')
  @HttpCode(HttpStatus.CREATED)
  async createBackup(
    @Body('type') type?: 'daily' | 'weekly' | 'monthly' | 'manual',
  ) {
    return this.backupService.createBackup(type || 'manual');
  }

  @Get('backups')
  async listBackups() {
    return this.backupService.listBackups();
  }

  @Get('backups/stats')
  async getBackupStats() {
    return this.backupService.getBackupStats();
  }

  @Post('backups/restore')
  @HttpCode(HttpStatus.OK)
  async restoreBackup(@Body('filepath') filepath: string) {
    return this.backupService.restoreBackup(filepath);
  }

  @Delete('backups/:filename')
  deleteBackup(@Param('filename') filename: string) {
    // Implementation would delete the backup file
    return { message: `Backup ${filename} deletion not implemented yet` };
  }

  // PITR Endpoints
  @Get('pitr/config')
  getPitrConfig() {
    return this.pitrService.generatePitrConfig();
  }

  @Post('pitr/base-backup')
  @HttpCode(HttpStatus.CREATED)
  async createBaseBackup() {
    return this.pitrService.createBaseBackup();
  }

  @Get('pitr/base-backups')
  async listBaseBackups() {
    return this.pitrService.listBaseBackups();
  }

  @Post('pitr/recover')
  @HttpCode(HttpStatus.OK)
  async recoverToTimestamp(
    @Body('backupPath') backupPath: string,
    @Body('targetTimestamp') targetTimestamp: string,
  ) {
    const targetDate = new Date(targetTimestamp);
    return this.pitrService.recoverToTimestamp(backupPath, targetDate);
  }

  @Get('pitr/stats')
  async getWalArchiveStats() {
    return this.pitrService.getWalArchiveStats();
  }
}
