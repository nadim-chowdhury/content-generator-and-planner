import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService with prepared statements support
 *
 * Prisma automatically uses prepared statements for all queries, which provides:
 * - Protection against SQL injection attacks
 * - Better performance through query plan caching
 * - Type-safe database access
 *
 * All queries executed through this service are automatically parameterized
 * and safe from SQL injection. Never use raw SQL queries or string concatenation.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    try {
      // Set connection timeout to prevent hanging
      await Promise.race([
        this.$connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database connection timeout')), 10000),
        ),
      ]);

      // Log connection status (optional, for debugging)
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Prisma connected with prepared statements enabled');
      }
    } catch (error: any) {
      console.error('❌ Failed to connect to database:', error.message);
      // Don't throw - allow server to start and retry on first query
      // This prevents blocking startup if DB is temporarily unavailable
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Execute a raw SQL query with parameters (uses prepared statements)
   * Use this only when Prisma's query builder doesn't support your use case
   *
   * @example
   * await prisma.$queryRaw`
   *   SELECT * FROM users WHERE email = ${email}
   * `
   */
  // Raw queries are available via $queryRaw and $executeRaw
  // They use prepared statements when using template literals
}
