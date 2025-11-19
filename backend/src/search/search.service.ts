import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Fuse = require('fuse.js');

interface SearchOptions {
  query: string;
  userId: string;
  teamId?: string;
  platforms?: string[];
  tags?: string[];
  status?: string[];
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  ideas: any[];
  folders: any[];
  total: number;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Global search across ideas and folders
   */
  async globalSearch(options: SearchOptions): Promise<SearchResult> {
    const {
      query,
      userId,
      teamId,
      platforms,
      tags,
      status,
      limit = 50,
      offset = 0,
    } = options;

    // Build where clause
    const where: any = {
      userId,
    };

    if (teamId) {
      // If teamId is provided, search across team members' ideas
      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: true,
        },
      });

      if (team) {
        const teamUserIds = [
          team.ownerId,
          ...team.members.map((m) => m.userId),
        ];
        where.userId = { in: teamUserIds };
      }
    }

    if (platforms && platforms.length > 0) {
      where.platform = { in: platforms };
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (tags && tags.length > 0) {
      where.OR = [
        { hashtags: { hasSome: tags } },
        { categoryTags: { hasSome: tags } },
        { customTags: { hasSome: tags } },
      ];
    }

    // Get all matching ideas
    const allIdeas = await this.prisma.idea.findMany({
      where,
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    // Get all folders
    const folderWhere: any = { userId };
    if (teamId) {
      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: true,
        },
      });

      if (team) {
        const teamUserIds = [
          team.ownerId,
          ...team.members.map((m) => m.userId),
        ];
        folderWhere.userId = { in: teamUserIds };
      }
    }

    const allFolders = await this.prisma.ideaFolder.findMany({
      where: folderWhere,
    });

    // Use Fuse.js for fuzzy search
    const fuseOptions = {
      keys: [
        { name: 'title', weight: 0.5 },
        { name: 'description', weight: 0.3 },
        { name: 'caption', weight: 0.2 },
        { name: 'niche', weight: 0.1 },
        { name: 'platform', weight: 0.1 },
      ],
      threshold: 0.4, // 0 = exact match, 1 = match anything
      includeScore: true,
    };

    const ideaFuse = new Fuse(allIdeas, fuseOptions);
    const folderFuse = new Fuse(allFolders, {
      keys: [
        { name: 'name', weight: 0.7 },
        { name: 'description', weight: 0.3 },
      ],
      threshold: 0.4,
      includeScore: true,
    });

    // Perform fuzzy search
    const ideaResults = query
      ? ideaFuse.search(query).map((result) => ({
          ...result.item,
          score: result.score,
        }))
      : allIdeas.map((idea) => ({ ...idea, score: 0 }));

    const folderResults = query
      ? folderFuse.search(query).map((result) => ({
          ...result.item,
          score: result.score,
        }))
      : allFolders.map((folder) => ({ ...folder, score: 0 }));

    // Sort by score (lower is better)
    ideaResults.sort((a, b) => (a.score || 0) - (b.score || 0));
    folderResults.sort((a, b) => (a.score || 0) - (b.score || 0));

    // Apply pagination to ideas
    const paginatedIdeas = ideaResults.slice(offset, offset + limit);

    return {
      ideas: paginatedIdeas.map((idea) => {
        const { score, ...ideaData } = idea;
        return ideaData;
      }),
      folders: folderResults.map((folder) => {
        const { score, ...folderData } = folder;
        return folderData;
      }),
      total: ideaResults.length,
    };
  }

  /**
   * Get available filters for search
   */
  async getSearchFilters(userId: string, teamId?: string) {
    const where: any = { userId };

    if (teamId) {
      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: true,
        },
      });

      if (team) {
        const teamUserIds = [
          team.ownerId,
          ...team.members.map((m) => m.userId),
        ];
        where.userId = { in: teamUserIds };
      }
    }

    const ideas = await this.prisma.idea.findMany({
      where,
      select: {
        platform: true,
        status: true,
        hashtags: true,
        categoryTags: true,
        customTags: true,
      },
    });

    // Extract unique values
    const platforms = [...new Set(ideas.map((i) => i.platform))].sort();
    const statuses = [...new Set(ideas.map((i) => i.status))].sort();
    const allHashtags = ideas.flatMap((i) => i.hashtags);
    const allCategoryTags = ideas.flatMap((i) => i.categoryTags);
    const allCustomTags = ideas.flatMap((i) => i.customTags);
    const allTags = [
      ...new Set([...allHashtags, ...allCategoryTags, ...allCustomTags]),
    ].sort();

    return {
      platforms,
      statuses,
      tags: allTags,
    };
  }

  /**
   * Save a search
   */
  async saveSearch(
    userId: string,
    name: string,
    query?: string,
    filters?: any,
    teamId?: string,
  ) {
    return this.prisma.savedSearch.create({
      data: {
        userId,
        name,
        query,
        filters,
        teamId,
      },
    });
  }

  /**
   * Get saved searches
   */
  async getSavedSearches(userId: string, teamId?: string) {
    const where: any = { userId };
    if (teamId) {
      where.teamId = teamId;
    } else {
      where.teamId = null; // Only global searches
    }

    return this.prisma.savedSearch.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Delete saved search
   */
  async deleteSavedSearch(userId: string, searchId: string) {
    return this.prisma.savedSearch.deleteMany({
      where: {
        id: searchId,
        userId, // Ensure user can only delete their own searches
      },
    });
  }
}
