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
import OpenAI from 'openai';
import { UserPlan, IdeaStatus } from '@prisma/client';

@Injectable()
export class IdeasService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async checkQuota(userId: string, userPlan: UserPlan): Promise<boolean> {
    if (userPlan === UserPlan.PRO || userPlan === UserPlan.AGENCY) {
      return true; // Unlimited for Pro/Agency
    }

    // Check daily quota for FREE users (5 generations/day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const generation = await this.prisma.ideaGeneration.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (!generation) {
      return true; // No generation today, allowed
    }

    return generation.count < 5; // Free users get 5 generations/day
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

  async generateIdeas(userId: string, userPlan: UserPlan, dto: GenerateIdeasDto) {
    // Check quota
    const canGenerate = await this.checkQuota(userId, userPlan);

    if (!canGenerate) {
      throw new ForbiddenException(
        'Daily quota exceeded. Upgrade to Pro for unlimited generations.',
      );
    }

    // Build AI prompt
    const prompt = this.buildPrompt(dto);

    try {
      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a content idea generator for social media creators. Generate exactly 10 content ideas in JSON format. Each idea must have: title, description (max 20 words), script (2-6 lines), caption, hashtags (array), and estimatedDuration (seconds).',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
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
      let ideasArray = [];
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

      // Ensure we have exactly 10 ideas
      if (ideasArray.length === 0) {
        throw new BadRequestException('No ideas generated');
      }

      // Limit to 10 ideas
      const ideas = ideasArray.slice(0, 10).map((idea: any) => ({
        title: idea.title || 'Untitled Idea',
        description: idea.description || idea.shortDescription || '',
        script: idea.script || idea.shortScript || '',
        caption: idea.caption || '',
        hashtags: Array.isArray(idea.hashtags) ? idea.hashtags : [],
        platform: dto.platform,
        niche: dto.niche,
        tone: dto.tone,
        duration: idea.estimatedDuration || idea.duration || null,
        viralScore: idea.viralScore || null,
      }));

      // Increment generation count
      await this.incrementGenerationCount(userId);

      return ideas;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('OpenAI API Error:', error);
      throw new BadRequestException('Failed to generate ideas. Please try again.');
    }
  }

  private buildPrompt(dto: GenerateIdeasDto): string {
    return `Generate 10 creative content ideas for ${dto.platform} in the "${dto.niche}" niche with a ${dto.tone} tone.

Requirements:
- Each idea must be unique and engaging
- Descriptions should be concise (max 20 words)
- Scripts should be 2-6 lines
- Captions should be platform-appropriate
- Hashtags should be relevant and trending
- Estimated duration should be realistic for the platform

Return the response as a JSON object with an "ideas" array containing exactly 10 idea objects. Each idea object must have:
- title (string)
- description (string, max 20 words)
- script (string, 2-6 lines)
- caption (string)
- hashtags (array of strings)
- estimatedDuration (number in seconds)

Example format:
{
  "ideas": [
    {
      "title": "Idea Title",
      "description": "Brief description",
      "script": "Line 1\\nLine 2\\nLine 3",
      "caption": "Engaging caption text",
      "hashtags": ["#hashtag1", "#hashtag2"],
      "estimatedDuration": 60
    }
  ]
}`;
  }

  async create(userId: string, dto: CreateIdeaDto) {
    return this.prisma.idea.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAll(userId: string, status?: IdeaStatus) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return this.prisma.idea.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const idea = await this.prisma.idea.findFirst({
      where: { id, userId },
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

  async getStats(userId: string) {
    const [total, saved, scheduled, todayGenerated] = await Promise.all([
      this.prisma.idea.count({ where: { userId } }),
      this.prisma.idea.count({ where: { userId, status: IdeaStatus.DRAFT } }),
      this.prisma.idea.count({ where: { userId, status: IdeaStatus.SCHEDULED } }),
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
      todayGenerated,
    };
  }
}

