import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { QueueModule } from '../queue/queue.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, QueueModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}


