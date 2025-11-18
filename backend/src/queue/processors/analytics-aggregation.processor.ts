import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('analytics-aggregation')
export class AnalyticsAggregationProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsAggregationProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ date: Date }>) {
    this.logger.log(`Processing analytics aggregation: ${job.id}`);

    try {
      const targetDate = new Date(job.data.date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Aggregate daily analytics
      const [
        totalIdeas,
        totalUsers,
        activeUsers,
        ideasByPlatform,
        ideasByNiche,
      ] = await Promise.all([
        // Total ideas created
        this.prisma.idea.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        }),
        // Total users
        this.prisma.user.count(),
        // Active users (users who created ideas or logged in)
        this.prisma.user.count({
          where: {
            OR: [
              {
                ideas: {
                  some: {
                    createdAt: {
                      gte: startOfDay,
                      lte: endOfDay,
                    },
                  },
                },
              },
              {
                sessions: {
                  some: {
                    lastUsedAt: {
                      gte: startOfDay,
                      lte: endOfDay,
                    },
                  },
                },
              },
            ],
          },
        }),
        // Ideas by platform
        this.prisma.idea.groupBy({
          by: ['platform'],
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          _count: true,
        }),
        // Ideas by niche
        this.prisma.idea.groupBy({
          by: ['niche'],
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          _count: true,
        }),
      ]);

      // Store aggregated data (you might want to create an AnalyticsAggregation model)
      this.logger.log(`Analytics aggregated for ${targetDate.toISOString()}:`, {
        totalIdeas,
        totalUsers,
        activeUsers,
        ideasByPlatform: ideasByPlatform.length,
        ideasByNiche: ideasByNiche.length,
      });

      return {
        date: targetDate.toISOString(),
        totalIdeas,
        totalUsers,
        activeUsers,
        ideasByPlatform,
        ideasByNiche,
      };
    } catch (error: any) {
      this.logger.error(`Failed to aggregate analytics: ${error.message}`, error.stack);
      throw error;
    }
  }
}

