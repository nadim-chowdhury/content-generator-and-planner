import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
const Papa = require('papaparse');

interface CSVRow {
  Title?: string;
  Description?: string;
  Hook?: string;
  Script?: string;
  Caption?: string;
  Hashtags?: string;
  'Category Tags'?: string;
  'Custom Tags'?: string;
  Platform?: string;
  Niche?: string;
  Tone?: string;
  Language?: string;
  Duration?: string;
  'Scheduled At'?: string;
  Status?: string;
  'Viral Score'?: string;
  'Posted To'?: string;
  Folder?: string;
}

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Import ideas from CSV
   */
  async importIdeasFromCSV(userId: string, csvContent: string) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const imported: any[] = [];
            const errors: any[] = [];

            for (let i = 0; i < results.data.length; i++) {
              const row = results.data[i];
              const rowNumber = i + 2; // +2 because header is row 1, and arrays are 0-indexed

              try {
                // Validate required fields
                if (!row.Title || !row.Platform || !row.Niche) {
                  errors.push({
                    row: rowNumber,
                    error: 'Missing required fields: Title, Platform, or Niche',
                    data: row,
                  });
                  continue;
                }

                // Parse arrays
                const hashtags = row.Hashtags
                  ? row.Hashtags.split(',').map((tag) => tag.trim()).filter(Boolean)
                  : [];
                const categoryTags = row['Category Tags']
                  ? row['Category Tags'].split(',').map((tag) => tag.trim()).filter(Boolean)
                  : [];
                const customTags = row['Custom Tags']
                  ? row['Custom Tags'].split(',').map((tag) => tag.trim()).filter(Boolean)
                  : [];
                const postedTo = row['Posted To']
                  ? row['Posted To'].split(',').map((p) => p.trim()).filter(Boolean)
                  : [];

                // Parse dates
                let scheduledAt: Date | null = null;
                if (row['Scheduled At']) {
                  scheduledAt = new Date(row['Scheduled At']);
                  if (isNaN(scheduledAt.getTime())) {
                    scheduledAt = null;
                  }
                }

                // Parse numbers
                const duration = row.Duration ? parseInt(row.Duration, 10) : null;
                const viralScore = row['Viral Score'] ? parseInt(row['Viral Score'], 10) : null;

                // Validate status
                const status = row.Status && ['DRAFT', 'SCHEDULED', 'POSTED', 'ARCHIVED'].includes(row.Status)
                  ? row.Status
                  : 'DRAFT';

                // Find or create folder
                let folderId: string | null = null;
                if (row.Folder) {
                  const folder = await this.prisma.ideaFolder.findFirst({
                    where: {
                      userId,
                      name: row.Folder,
                    },
                  });

                  if (folder) {
                    folderId = folder.id;
                  } else {
                    const newFolder = await this.prisma.ideaFolder.create({
                      data: {
                        userId,
                        name: row.Folder,
                      },
                    });
                    folderId = newFolder.id;
                  }
                }

                // Create idea
                const idea = await this.prisma.idea.create({
                  data: {
                    userId,
                    title: row.Title,
                    description: row.Description || null,
                    hook: row.Hook || null,
                    script: row.Script || null,
                    caption: row.Caption || null,
                    hashtags,
                    categoryTags,
                    customTags,
                    platform: row.Platform,
                    niche: row.Niche,
                    tone: row.Tone || 'professional',
                    language: row.Language || 'en',
                    duration: duration && !isNaN(duration) ? duration : null,
                    scheduledAt,
                    status: status as any,
                    viralScore: viralScore && !isNaN(viralScore) ? viralScore : null,
                    postedTo,
                    folderId,
                  },
                });

                imported.push({
                  row: rowNumber,
                  id: idea.id,
                  title: idea.title,
                });
              } catch (error: any) {
                errors.push({
                  row: rowNumber,
                  error: error.message || 'Unknown error',
                  data: row,
                });
              }
            }

            resolve({
              success: true,
              imported: imported.length,
              errors: errors.length,
              details: {
                imported,
                errors,
              },
            });
          } catch (error: any) {
            reject(new BadRequestException(`Import failed: ${error.message}`));
          }
        },
        error: (error) => {
          reject(new BadRequestException(`CSV parsing failed: ${error.message}`));
        },
      });
    });
  }
}

