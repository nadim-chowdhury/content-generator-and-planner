import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateIdeasDto } from './dto/generate-ideas.dto';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { PlatformOptimizerService } from './services/platform-optimizer.service';
import { LanguageService } from './services/language.service';
import { OpenAIService } from '../common/openai/openai.service';

enum UserPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  AGENCY = 'AGENCY',
}

enum IdeaStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  POSTED = 'POSTED',
  ARCHIVED = 'ARCHIVED',
}

@Injectable()
export class IdeasService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private platformOptimizer: PlatformOptimizerService,
    private languageService: LanguageService,
    private openaiService: OpenAIService,
  ) {}

  async checkQuota(userId: string, userPlan: UserPlan): Promise<boolean> {
    if (userPlan === UserPlan.PRO || userPlan === UserPlan.AGENCY) {
      return true; // Unlimited for Pro/Agency
    }

    // Get user with usage tracking
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        dailyAiGenerations: true,
        lastGenerationReset: true,
        freeTrialUsed: true,
        freeTrialEndsAt: true,
      },
    });

    if (!user) {
      return false;
    }

    // Check if user is on free trial
    const isOnTrial = user.freeTrialEndsAt && new Date() < user.freeTrialEndsAt;
    if (isOnTrial) {
      return true; // Unlimited during trial
    }

    // Reset daily count if needed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastReset = user.lastGenerationReset
      ? new Date(user.lastGenerationReset)
      : null;

    if (!lastReset || lastReset < today) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          dailyAiGenerations: 0,
          lastGenerationReset: today,
        },
      });
      return true; // Reset, so allowed
    }

    // Check daily quota for FREE users (5 generations/day)
    return (user.dailyAiGenerations || 0) < 5;
  }

  async incrementGenerationCount(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.ideaGeneration.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      create: {
        userId,
        date: today,
        count: 1,
      },
      update: {
        count: {
          increment: 1,
        },
      },
    });
  }

  async generateIdeas(
    userPlan: UserPlan,
    userId: string,
    dto: GenerateIdeasDto,
  ) {
    // Check quota
    const canGenerate = await this.checkQuota(userId, userPlan);

    if (!canGenerate) {
      throw new ForbiddenException(
        'Daily quota exceeded. Upgrade to Pro for unlimited generations.',
      );
    }

    // Determine count (10-30, default 10)
    const count =
      dto.count && dto.count >= 10 && dto.count <= 30 ? dto.count : 10;

    // Determine language (default: English)
    const language =
      dto.language && this.languageService.isSupported(dto.language)
        ? dto.language
        : this.languageService.getDefaultLanguage();

    // Build human-like AI prompt
    const prompt = this.buildPrompt(dto, count, language);

    try {
      // Call OpenAI API with human-like prompts
      const completion = await this.openaiService.createChatCompletion({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `I'm a content creator working on ${dto.platform} in the ${dto.niche} niche. I need ${count} fresh, creative content ideas that will really connect with my audience.

Each idea should feel authentic and natural - like it came from a real person, not AI. Here's what I need for each idea:
- title: Something catchy that makes people want to click (but not clickbait-y)
- description: A quick summary in 15-30 words that gets people interested
- hook: The opening line that grabs attention right away (1-2 sentences max)
- script: The actual content outline or script (3-8 lines for videos, structured format for posts)
- caption: A caption that feels real and engaging, not robotic
- hashtags: 5-15 hashtags that actually make sense and are trending
- categoryTags: 3-7 tags that help organize this (like ["tutorial", "lifestyle", "tips"])
- viralScore: How likely this is to go viral (0-100, be realistic)
- estimatedDuration: How long the content should be in seconds
- thumbnailSuggestion: What the thumbnail should look like (be specific)
- platformOptimization: Tips specific to ${dto.platform} that will help this perform

${this.languageService.getLanguageInstruction(language)}

Write everything naturally - like you're a real creator brainstorming ideas, not an AI generating content. Make it feel authentic and human.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.9, // Higher temperature for more human-like, creative responses
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new BadRequestException('Failed to generate ideas');
      }

      // Parse JSON response
      let ideasData;
      try {
        ideasData = JSON.parse(content);
      } catch (error) {
        // Try to extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          ideasData = JSON.parse(jsonMatch[0]);
        } else {
          throw new BadRequestException('Invalid AI response format');
        }
      }

      // Normalize response - handle both {ideas: [...]} and direct array
      let ideasArray: any[] = [];
      if (ideasData.ideas && Array.isArray(ideasData.ideas)) {
        ideasArray = ideasData.ideas;
      } else if (Array.isArray(ideasData)) {
        ideasArray = ideasData;
      } else {
        // Try to find any array in the response
        const arrayKey = Object.keys(ideasData).find(
          (key) => Array.isArray(ideasData[key]) && ideasData[key].length > 0,
        );
        if (arrayKey) {
          ideasArray = ideasData[arrayKey];
        }
      }

      // Ensure we have ideas
      if (ideasArray.length === 0) {
        throw new BadRequestException('No ideas generated');
      }

      // Limit to requested count and create ideas in database
      const ideasToCreate = ideasArray.slice(0, count).map((idea: any) => ({
        title: idea.title || 'Untitled Idea',
        description: idea.description || idea.shortDescription || '',
        hook: idea.hook || idea.openingHook || '',
        script: idea.script || idea.shortScript || idea.content || '',
        caption: idea.caption || idea.postCaption || '',
        hashtags: Array.isArray(idea.hashtags)
          ? idea.hashtags.map((h: string) => (h.startsWith('#') ? h : `#${h}`))
          : [],
        categoryTags: Array.isArray(idea.categoryTags)
          ? idea.categoryTags
          : idea.categories
            ? Array.isArray(idea.categories)
              ? idea.categories
              : [idea.categories]
            : [],
        platform: dto.platform,
        niche: dto.niche,
        tone: dto.tone,
        language: language,
        duration:
          idea.estimatedDuration || idea.duration || idea.videoLength || null,
        viralScore:
          idea.viralScore !== undefined
            ? Math.max(0, Math.min(100, parseInt(idea.viralScore) || 0))
            : null,
        thumbnailSuggestion:
          idea.thumbnailSuggestion ||
          idea.thumbnailDescription ||
          idea.imageSuggestion ||
          '',
        platformOptimization:
          idea.platformOptimization || idea.optimizationNotes || '',
      }));

      // Create ideas in database
      const createdIdeas = await Promise.all(
        ideasToCreate.map((ideaData) =>
          this.prisma.idea.create({
            data: {
              ...ideaData,
              userId,
            },
          }),
        ),
      );

      // Increment generation count
      await this.incrementGenerationCount(userId);

      return createdIdeas;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('OpenAI API Error:', error);
      throw new BadRequestException(
        'Failed to generate ideas. Please try again.',
      );
    }
  }

  private buildPrompt(
    dto: GenerateIdeasDto,
    count: number,
    language: string,
  ): string {
    const platformSpecific = this.getPlatformSpecificGuidance(dto.platform);
    const platformSpecs = this.platformOptimizer.getPlatformSpecs(dto.platform);
    const optimalDuration = platformSpecs?.optimalDuration.recommended || 30;
    const recommendedHashtags = platformSpecs?.hashtagCount.recommended || 5;
    const bestPractices = platformSpecs?.bestPractices.join(', ') || '';

    const prompt = `I'm looking for ${count} really solid content ideas for ${dto.platform}. My niche is ${dto.niche}, and I want the tone to be ${dto.tone} - like I'm talking to friends, not giving a formal presentation.

${platformSpecific}

Here's what I know about ${dto.platform}:
- Best video length: around ${optimalDuration} seconds (but anywhere from ${platformSpecs?.optimalDuration.min || 15} to ${platformSpecs?.optimalDuration.max || 60} works)
- Format: ${platformSpecs?.aspectRatio || '9:16'} aspect ratio
- Hashtags: I usually use around ${recommendedHashtags} hashtags
- What works: ${bestPractices}

When you create these ideas, make them feel real and authentic. Don't make them sound like they came from a content factory. I want:
- Titles that make people curious, not clickbait
- Descriptions that actually tell people what they'll get
- Hooks that feel natural, not forced
- Scripts that sound like how I actually talk
- Captions that feel genuine and engaging
- Hashtags that make sense for my niche
- Realistic viral scores (not everything is going to go viral)
- Duration that fits ${dto.platform}
- Thumbnail ideas that are actually doable
- Tips that are specific to ${dto.platform}

${dto.additionalContext ? `Oh, and here's some extra context: ${dto.additionalContext}\n` : ''}Give me a JSON object with an "ideas" array that has exactly ${count} ideas. Make each one feel like a real person came up with it, not an AI.`;

    return prompt;
  }

  private getPlatformSpecificGuidance(platform: string): string {
    const guidance: Record<string, string> = {
      YouTube:
        'Platform: YouTube - Long-form video content (5-60+ minutes). Focus on in-depth tutorials, vlogs, educational content. Include detailed thumbnail descriptions with text overlays. Optimal aspect ratio: 16:9. Captions should include timestamps, chapters, and strong CTAs.',
      'YouTube Shorts':
        'Platform: YouTube Shorts - Short-form vertical video content (15-60 seconds). Focus on quick hooks, trending sounds, and viral-worthy moments. Vertical format (9:16). Thumbnail suggestions should describe the first frame. Use trending hashtags and music. Optimize for discovery in Shorts feed.',
      TikTok:
        'Platform: TikTok - Short-form vertical video content (15-60 seconds, up to 10 minutes for some creators). Focus on trending sounds, challenges, quick hooks, and authentic content. Vertical format (9:16). Thumbnail suggestions should describe the first frame. Use trending hashtags and participate in challenges.',
      'Instagram Reels':
        'Platform: Instagram Reels - Short-form vertical video content (15-90 seconds, up to 15 minutes for some accounts). Focus on trending audio, visual storytelling, and engagement. Vertical format (9:16). Include visual descriptions for thumbnails. Use 5-10 relevant hashtags. Optimize for Instagram algorithm (engagement, saves, shares).',
      'Facebook Reels':
        'Platform: Facebook Reels - Short-form vertical video content (15-90 seconds). Similar to Instagram Reels but optimized for Facebook audience. Vertical format (9:16). Focus on community engagement, relatable content, and shareable moments. Use Facebook-specific hashtags.',
      Twitter:
        'Platform: Twitter/X - Text-based content (280 characters), threads, or short video clips (up to 2:20). Focus on timely, conversational content. For video: horizontal or square format. Captions should be tweet-optimized with engagement hooks. Use trending hashtags sparingly (1-2). Thread format for longer content.',
      LinkedIn:
        'Platform: LinkedIn - Professional content, thought leadership, B2B focus. Text posts (up to 3000 characters), articles, or short videos (up to 10 minutes). Professional tone required. Include industry-specific hashtags (3-5). Optimize for LinkedIn algorithm (comments, shares, reactions).',
      Instagram:
        'Platform: Instagram - Feed posts, Stories, or IGTV. Square (1:1) or vertical (4:5) format. Focus on visual storytelling, aesthetic consistency. Include detailed image descriptions. Use 5-10 relevant hashtags. Optimize for engagement (likes, comments, saves).',
      Facebook:
        'Platform: Facebook - Posts, videos, or Stories. Various formats supported. Focus on community engagement, shareable content. Include engagement-focused captions with questions. Use Facebook-specific features (polls, events).',
      Threads:
        'Platform: Threads - Text-based conversational content (up to 500 characters) or short videos. Similar to Twitter but with Instagram integration. Focus on authentic, conversational content. Use relevant hashtags (1-3).',
      Pinterest:
        'Platform: Pinterest - Visual content with detailed descriptions. Vertical format (2:3 or 9:16). Focus on searchable keywords, detailed descriptions, and vertical images. Include rich pins metadata. Optimize for Pinterest SEO.',
      Reddit:
        'Platform: Reddit - Subreddit-specific content. Text posts, images, or videos. Focus on discussion-worthy topics, community engagement, and following subreddit rules. No hashtags. Format depends on subreddit.',
      Quora:
        'Platform: Quora - Question-answer format. Focus on informative, detailed responses. Text-based with optional images. Professional and helpful tone. No hashtags. Optimize for upvotes and expert answers.',
    };

    return (
      guidance[platform] ||
      `Platform: ${platform} - Optimize content for this platform's best practices.`
    );
  }

  async create(userId: string, dto: CreateIdeaDto) {
    return this.prisma.idea.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAll(
    userId: string,
    status?: IdeaStatus,
    folderId?: string,
    tags?: string[],
    search?: string,
    platform?: string,
    language?: string,
    createdAtFrom?: string,
    createdAtTo?: string,
    scheduledAtFrom?: string,
    scheduledAtTo?: string,
    viralScoreMin?: number,
    viralScoreMax?: number,
  ) {
    const where: any = { userId };

    if (status) {
      where.status = status;
    } else {
      // Exclude archived by default unless specifically requested
      where.status = { not: IdeaStatus.ARCHIVED };
    }

    if (folderId) {
      where.folderId = folderId;
    }

    if (platform) {
      where.platform = platform;
    }

    if (language) {
      where.language = language;
    }

    // Date range filtering
    if (createdAtFrom || createdAtTo) {
      where.createdAt = {};
      if (createdAtFrom) {
        where.createdAt.gte = new Date(createdAtFrom);
      }
      if (createdAtTo) {
        where.createdAt.lte = new Date(createdAtTo);
      }
    }

    if (scheduledAtFrom || scheduledAtTo) {
      where.scheduledAt = {};
      if (scheduledAtFrom) {
        where.scheduledAt.gte = new Date(scheduledAtFrom);
      }
      if (scheduledAtTo) {
        where.scheduledAt.lte = new Date(scheduledAtTo);
      }
    }

    // Viral score range filtering
    if (viralScoreMin !== undefined || viralScoreMax !== undefined) {
      where.viralScore = {};
      if (viralScoreMin !== undefined) {
        where.viralScore.gte = viralScoreMin;
      }
      if (viralScoreMax !== undefined) {
        where.viralScore.lte = viralScoreMax;
      }
    }

    if (tags && tags.length > 0) {
      where.OR = [
        { categoryTags: { hasSome: tags } },
        { customTags: { hasSome: tags } },
      ];
    }

    if (search) {
      const searchConditions = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { niche: { contains: search, mode: 'insensitive' } },
      ];

      if (where.OR) {
        // Combine with existing OR conditions
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    return this.prisma.idea.findMany({
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const idea = await this.prisma.idea.findFirst({
      where: { id, userId },
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

    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    return idea;
  }

  async update(id: string, userId: string, dto: UpdateIdeaDto) {
    const idea = await this.findOne(id, userId);

    const updateData: any = { ...dto };
    if (dto.scheduledAt) {
      updateData.scheduledAt = new Date(dto.scheduledAt);
      updateData.status = IdeaStatus.SCHEDULED;
    }

    return this.prisma.idea.update({
      where: { id: idea.id },
      data: updateData,
    });
  }

  async remove(id: string, userId: string) {
    const idea = await this.findOne(id, userId);
    await this.prisma.idea.delete({ where: { id: idea.id } });
    return { message: 'Idea deleted successfully' };
  }

  /**
   * Duplicate an idea
   */
  async duplicate(
    id: string,
    userId: string,
    newTitle?: string,
    folderId?: string,
  ) {
    const idea = await this.findOne(id, userId);

    const duplicateData: any = {
      title: newTitle || `${idea.title} (Copy)`,
      description: idea.description,
      hook: idea.hook,
      script: idea.script,
      caption: idea.caption,
      hashtags: idea.hashtags,
      categoryTags: idea.categoryTags,
      customTags: idea.customTags || [],
      platform: idea.platform,
      niche: idea.niche,
      tone: idea.tone,
      language: idea.language,
      duration: idea.duration,
      thumbnailSuggestion: idea.thumbnailSuggestion,
      platformOptimization: idea.platformOptimization,
      userId,
      status: IdeaStatus.DRAFT, // Duplicates start as drafts
    };

    if (folderId) {
      // Verify folder belongs to user
      const folder = await this.prisma.ideaFolder.findFirst({
        where: { id: folderId, userId },
      });
      if (folder) {
        duplicateData.folderId = folderId;
      }
    }

    return this.prisma.idea.create({
      data: duplicateData,
    });
  }

  /**
   * Archive an idea
   */
  async archive(id: string, userId: string) {
    const idea = await this.findOne(id, userId);

    return this.prisma.idea.update({
      where: { id: idea.id },
      data: {
        status: IdeaStatus.ARCHIVED,
        archivedAt: new Date(),
      },
    });
  }

  /**
   * Unarchive an idea
   */
  async unarchive(id: string, userId: string) {
    const idea = await this.findOne(id, userId);

    if (idea.status !== IdeaStatus.ARCHIVED) {
      throw new BadRequestException('Idea is not archived');
    }

    return this.prisma.idea.update({
      where: { id: idea.id },
      data: {
        status: IdeaStatus.DRAFT,
        archivedAt: null,
      },
    });
  }

  /**
   * Bulk operations
   */
  async bulkOperations(
    userId: string,
    ideaIds: string[],
    operation: string,
    folderId?: string,
  ) {
    // Verify all ideas belong to user
    const ideas = await this.prisma.idea.findMany({
      where: {
        id: { in: ideaIds },
        userId,
      },
    });

    if (ideas.length !== ideaIds.length) {
      throw new BadRequestException('Some ideas not found or access denied');
    }

    switch (operation) {
      case 'DELETE':
        await this.prisma.idea.deleteMany({
          where: {
            id: { in: ideaIds },
            userId,
          },
        });
        return { message: `${ideaIds.length} ideas deleted successfully` };

      case 'ARCHIVE':
        await this.prisma.idea.updateMany({
          where: {
            id: { in: ideaIds },
            userId,
          },
          data: {
            status: IdeaStatus.ARCHIVED,
            archivedAt: new Date(),
          },
        });
        return { message: `${ideaIds.length} ideas archived successfully` };

      case 'UNARCHIVE':
        await this.prisma.idea.updateMany({
          where: {
            id: { in: ideaIds },
            userId,
            status: IdeaStatus.ARCHIVED,
          },
          data: {
            status: IdeaStatus.DRAFT,
            archivedAt: null,
          },
        });
        return { message: `${ideaIds.length} ideas unarchived successfully` };

      case 'MOVE':
        if (folderId) {
          // Verify folder belongs to user
          const folder = await this.prisma.ideaFolder.findFirst({
            where: { id: folderId, userId },
          });
          if (!folder) {
            throw new NotFoundException('Folder not found');
          }
        }

        await this.prisma.idea.updateMany({
          where: {
            id: { in: ideaIds },
            userId,
          },
          data: {
            folderId: folderId || null,
          },
        });
        return { message: `${ideaIds.length} ideas moved successfully` };

      default:
        throw new BadRequestException('Invalid operation');
    }
  }

  /**
   * Bulk export
   */
  async bulkExport(
    userId: string,
    ideaIds: string[],
    format: string = 'json',
    googleSheetsId?: string,
    notionDatabaseId?: string,
  ) {
    const ideas = await this.prisma.idea.findMany({
      where: {
        id: { in: ideaIds },
        userId,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (ideas.length === 0) {
      throw new NotFoundException('No ideas found');
    }

    switch (format) {
      case 'csv':
        return this.exportToCSV(ideas);

      case 'pdf':
        return this.exportToPDF(ideas);

      case 'text':
        return this.exportToText(ideas);

      case 'google_sheets':
        if (!googleSheetsId) {
          throw new BadRequestException('Google Sheets ID is required');
        }
        return this.exportToGoogleSheets(ideas, googleSheetsId, userId);

      case 'notion':
        if (!notionDatabaseId) {
          throw new BadRequestException('Notion Database ID is required');
        }
        return this.exportToNotion(ideas, notionDatabaseId, userId);

      default:
        // JSON format
        return { format: 'json', data: ideas, count: ideas.length };
    }
  }

  /**
   * Export to CSV
   */
  private exportToCSV(ideas: any[]) {
    const headers = [
      'Title',
      'Description',
      'Hook',
      'Script',
      'Caption',
      'Hashtags',
      'Platform',
      'Niche',
      'Tone',
      'Language',
      'Duration',
      'Status',
      'Viral Score',
      'Folder',
      'Scheduled At',
      'Created At',
    ];
    const rows = ideas.map((idea) => [
      idea.title,
      idea.description || '',
      idea.hook || '',
      idea.script || '',
      idea.caption || '',
      idea.hashtags?.join('; ') || '',
      idea.platform,
      idea.niche,
      idea.tone,
      idea.language || 'en',
      idea.duration?.toString() || '',
      idea.status,
      idea.viralScore?.toString() || '',
      idea.folder?.name || '',
      idea.scheduledAt ? idea.scheduledAt.toISOString() : '',
      idea.createdAt.toISOString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');

    return { format: 'csv', data: csv, count: ideas.length };
  }

  /**
   * Export to PDF
   */
  private exportToPDF(ideas: any[]) {
    // For PDF generation, we'll return HTML that can be converted to PDF on the frontend
    // Or use a library like pdfkit or puppeteer on the backend
    // For now, we'll return structured data that frontend can convert

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Content Ideas Export</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .idea { margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    .idea-title { font-size: 18px; font-weight: bold; color: #4F46E5; margin-bottom: 10px; }
    .idea-field { margin: 5px 0; }
    .idea-label { font-weight: bold; color: #666; }
    .hashtags { color: #4F46E5; }
  </style>
</head>
<body>
  <h1>Content Ideas Export</h1>
  <p>Generated on: ${new Date().toLocaleString()}</p>
  <p>Total Ideas: ${ideas.length}</p>
  ${ideas
    .map(
      (idea, index) => `
    <div class="idea">
      <div class="idea-title">${index + 1}. ${idea.title}</div>
      ${idea.description ? `<div class="idea-field"><span class="idea-label">Description:</span> ${idea.description}</div>` : ''}
      ${idea.hook ? `<div class="idea-field"><span class="idea-label">Hook:</span> ${idea.hook}</div>` : ''}
      ${idea.script ? `<div class="idea-field"><span class="idea-label">Script:</span> ${idea.script}</div>` : ''}
      ${idea.caption ? `<div class="idea-field"><span class="idea-label">Caption:</span> ${idea.caption}</div>` : ''}
      ${idea.hashtags && idea.hashtags.length > 0 ? `<div class="idea-field"><span class="idea-label">Hashtags:</span> <span class="hashtags">${idea.hashtags.join(' ')}</span></div>` : ''}
      <div class="idea-field"><span class="idea-label">Platform:</span> ${idea.platform}</div>
      <div class="idea-field"><span class="idea-label">Niche:</span> ${idea.niche}</div>
      <div class="idea-field"><span class="idea-label">Tone:</span> ${idea.tone}</div>
      ${idea.duration ? `<div class="idea-field"><span class="idea-label">Duration:</span> ${idea.duration}s</div>` : ''}
      ${idea.viralScore ? `<div class="idea-field"><span class="idea-label">Viral Score:</span> ${idea.viralScore}/100</div>` : ''}
      <div class="idea-field"><span class="idea-label">Status:</span> ${idea.status}</div>
      ${idea.scheduledAt ? `<div class="idea-field"><span class="idea-label">Scheduled:</span> ${new Date(idea.scheduledAt).toLocaleString()}</div>` : ''}
    </div>
  `,
    )
    .join('')}
</body>
</html>
    `;

    return {
      format: 'pdf',
      data: htmlContent,
      count: ideas.length,
      type: 'html',
    }; // Return HTML for frontend conversion
  }

  /**
   * Export to Text
   */
  private exportToText(ideas: any[]) {
    const textContent = ideas
      .map((idea, index) => {
        return `
${index + 1}. ${idea.title}
${idea.description ? `Description: ${idea.description}` : ''}
${idea.hook ? `Hook: ${idea.hook}` : ''}
${idea.script ? `Script:\n${idea.script}` : ''}
${idea.caption ? `Caption: ${idea.caption}` : ''}
${idea.hashtags && idea.hashtags.length > 0 ? `Hashtags: ${idea.hashtags.join(' ')}` : ''}
Platform: ${idea.platform} | Niche: ${idea.niche} | Tone: ${idea.tone}
${idea.duration ? `Duration: ${idea.duration}s` : ''}
${idea.viralScore ? `Viral Score: ${idea.viralScore}/100` : ''}
Status: ${idea.status}
${idea.scheduledAt ? `Scheduled: ${new Date(idea.scheduledAt).toLocaleString()}` : ''}
Created: ${new Date(idea.createdAt).toLocaleString()}
---
`;
      })
      .join('\n');

    return { format: 'text', data: textContent, count: ideas.length };
  }

  /**
   * Export to Google Sheets
   */
  private exportToGoogleSheets(
    ideas: any[],
    spreadsheetId: string,
    userId: string,
  ) {
    // This would require Google Sheets API integration
    // For now, return CSV data that can be imported
    const csvExport = this.exportToCSV(ideas);
    return {
      format: 'google_sheets',
      message:
        'Google Sheets export initiated. Use the CSV data to import manually, or configure Google Sheets API.',
      csvData: csvExport.data,
      spreadsheetId,
      count: ideas.length,
    };
  }

  /**
   * Export to Notion
   */
  private exportToNotion(ideas: any[], databaseId: string, userId: string) {
    // This would require Notion API integration
    // For now, return structured data
    return {
      format: 'notion',
      message:
        'Notion export initiated. Use the structured data to import manually, or configure Notion API.',
      data: ideas.map((idea) => ({
        title: idea.title,
        description: idea.description,
        platform: idea.platform,
        niche: idea.niche,
        tone: idea.tone,
        status: idea.status,
        viralScore: idea.viralScore,
        scheduledAt: idea.scheduledAt,
      })),
      databaseId,
      count: ideas.length,
    };
  }

  /**
   * Folder management
   */
  async createFolder(
    userId: string,
    dto: { name: string; description?: string; color?: string; icon?: string },
  ) {
    return this.prisma.ideaFolder.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async getFolders(userId: string) {
    return this.prisma.ideaFolder.findMany({
      where: { userId },
      include: {
        _count: {
          select: { ideas: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFolder(id: string, userId: string) {
    const folder = await this.prisma.ideaFolder.findFirst({
      where: { id, userId },
      include: {
        ideas: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { ideas: true },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return folder;
  }

  async updateFolder(
    id: string,
    userId: string,
    dto: { name?: string; description?: string; color?: string; icon?: string },
  ) {
    const folder = await this.prisma.ideaFolder.findFirst({
      where: { id, userId },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return this.prisma.ideaFolder.update({
      where: { id },
      data: dto,
    });
  }

  async deleteFolder(id: string, userId: string) {
    const folder = await this.prisma.ideaFolder.findFirst({
      where: { id, userId },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // Ideas will have folderId set to null (onDelete: SetNull)
    await this.prisma.ideaFolder.delete({
      where: { id },
    });

    return { message: 'Folder deleted successfully' };
  }

  /**
   * Get all tags (category tags + custom tags)
   */
  async getAllTags(userId: string) {
    const ideas = await this.prisma.idea.findMany({
      where: { userId },
      select: {
        categoryTags: true,
        customTags: true,
      },
    });

    const categoryTags = new Set<string>();
    const customTags = new Set<string>();

    ideas.forEach((idea) => {
      idea.categoryTags.forEach((tag) => categoryTags.add(tag));
      (idea.customTags || []).forEach((tag) => customTags.add(tag));
    });

    return {
      categoryTags: Array.from(categoryTags).sort(),
      customTags: Array.from(customTags).sort(),
      allTags: Array.from(new Set([...categoryTags, ...customTags])).sort(),
    };
  }

  async getStats(userId: string) {
    const [total, saved, scheduled, archived, todayGenerated] =
      await Promise.all([
        this.prisma.idea.count({
          where: { userId, status: { not: IdeaStatus.ARCHIVED } },
        }),
        this.prisma.idea.count({ where: { userId, status: IdeaStatus.DRAFT } }),
        this.prisma.idea.count({
          where: { userId, status: IdeaStatus.SCHEDULED },
        }),
        this.prisma.idea.count({
          where: { userId, status: IdeaStatus.ARCHIVED },
        }),
        this.prisma.idea.count({
          where: {
            userId,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      ]);

    return {
      total,
      saved,
      scheduled,
      archived,
      todayGenerated,
    };
  }
}
