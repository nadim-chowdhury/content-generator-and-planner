import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenAIService } from '../../common/openai/openai.service';

@Injectable()
export class PredictionService {
  private readonly logger = new Logger(PredictionService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private openaiService: OpenAIService,
  ) {}

  /**
   * Predict reach potential for an idea
   */
  async predictReach(ideaId: string, userId: string): Promise<{ reach: number; score: number; reasoning: string }> {
    const idea = await this.prisma.idea.findFirst({
      where: { id: ideaId, userId },
    });

    if (!idea) {
      throw new Error('Idea not found');
    }

    // Get historical data for similar content
    const similarAnalytics = await this.prisma.contentAnalytics.findMany({
      where: {
        userId,
        platform: idea.platform,
        category: { in: idea.categoryTags },
        reach: { not: null },
      },
      take: 20,
      orderBy: { recordedAt: 'desc' },
    });

    try {
      const prompt = `Based on the following content idea, predict its potential reach on ${idea.platform}.

Content Title: ${idea.title}
Description: ${idea.description || 'N/A'}
Platform: ${idea.platform}
Niche: ${idea.niche}
Tone: ${idea.tone}
Viral Score: ${idea.viralScore || 'N/A'}
Hashtags: ${idea.hashtags.join(', ') || 'None'}
Category Tags: ${idea.categoryTags.join(', ') || 'None'}

${similarAnalytics.length > 0 ? `Historical Performance (similar content):
${similarAnalytics.map(a => `- Reach: ${a.reach}, Engagement: ${a.engagement || 'N/A'}`).join('\n')}` : 'No historical data available.'}

Predict the potential reach (number of people who will see this content) and provide:
1. Estimated reach (realistic number)
2. Reach potential score (0-100, where 100 is maximum potential)
3. Brief reasoning for the prediction

Return a JSON object with: reach (number), score (0-100), reasoning (string).`;

      const completion = await this.openaiService.createChatCompletion({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'I need realistic predictions about how this content will perform. Be honest - not everything goes viral. Give me numbers that make sense based on what actually happens, not inflated estimates.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Failed to generate prediction');
      }

      const data = JSON.parse(content);
      return {
        reach: data.reach || this.getFallbackReach(idea.platform),
        score: data.score || 50,
        reasoning: data.reasoning || 'Prediction based on content analysis.',
      };
    } catch (error) {
      this.logger.error('Failed to predict reach:', error);
      return {
        reach: this.getFallbackReach(idea.platform),
        score: idea.viralScore || 50,
        reasoning: 'Prediction based on viral score and platform averages.',
      };
    }
  }

  /**
   * Predict engagement for an idea
   */
  async predictEngagement(ideaId: string, userId: string): Promise<{ engagement: number; score: number; reasoning: string }> {
    const idea = await this.prisma.idea.findFirst({
      where: { id: ideaId, userId },
    });

    if (!idea) {
      throw new Error('Idea not found');
    }

    const similarAnalytics = await this.prisma.contentAnalytics.findMany({
      where: {
        userId,
        platform: idea.platform,
        category: { in: idea.categoryTags },
        engagement: { not: null },
        reach: { not: null },
      },
      take: 20,
      orderBy: { recordedAt: 'desc' },
    });

    try {
      const prompt = `Based on the following content idea, predict its potential engagement on ${idea.platform}.

Content Title: ${idea.title}
Description: ${idea.description || 'N/A'}
Platform: ${idea.platform}
Niche: ${idea.niche}
Tone: ${idea.tone}
Viral Score: ${idea.viralScore || 'N/A'}
Hashtags: ${idea.hashtags.join(', ') || 'None'}
Hook: ${idea.hook || 'N/A'}

${similarAnalytics.length > 0 ? `Historical Engagement Rates (similar content):
${similarAnalytics.map(a => {
  const rate = a.reach && a.reach > 0 ? ((a.engagement || 0) / a.reach * 100).toFixed(2) : 'N/A';
  return `- Engagement Rate: ${rate}% (Reach: ${a.reach}, Engagement: ${a.engagement})`;
}).join('\n')}` : 'No historical data available.'}

Predict the potential engagement (likes, comments, shares, saves combined) and provide:
1. Estimated engagement (realistic number)
2. Engagement score (0-100, where 100 is maximum potential)
3. Brief reasoning for the prediction

Return a JSON object with: engagement (number), score (0-100), reasoning (string).`;

      const completion = await this.openaiService.createChatCompletion({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'I need realistic predictions about how this content will perform. Be honest - not everything goes viral. Give me numbers that make sense based on what actually happens, not inflated estimates.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Failed to generate prediction');
      }

      const data = JSON.parse(content);
      return {
        engagement: data.engagement || this.getFallbackEngagement(idea.platform),
        score: data.score || 50,
        reasoning: data.reasoning || 'Prediction based on content analysis.',
      };
    } catch (error) {
      this.logger.error('Failed to predict engagement:', error);
      return {
        engagement: this.getFallbackEngagement(idea.platform),
        score: idea.viralScore || 50,
        reasoning: 'Prediction based on viral score and platform averages.',
      };
    }
  }

  /**
   * Get fallback reach based on platform
   */
  private getFallbackReach(platform: string): number {
    const platformDefaults: Record<string, number> = {
      'Instagram': 1000,
      'Instagram Reels': 5000,
      'Facebook': 2000,
      'Facebook Reels': 3000,
      'Twitter': 500,
      'LinkedIn': 800,
      'TikTok': 10000,
      'YouTube': 2000,
      'YouTube Shorts': 5000,
    };
    return platformDefaults[platform] || 1000;
  }

  /**
   * Get fallback engagement based on platform
   */
  private getFallbackEngagement(platform: string): number {
    const platformDefaults: Record<string, number> = {
      'Instagram': 50,
      'Instagram Reels': 250,
      'Facebook': 100,
      'Facebook Reels': 150,
      'Twitter': 25,
      'LinkedIn': 40,
      'TikTok': 500,
      'YouTube': 100,
      'YouTube Shorts': 250,
    };
    return platformDefaults[platform] || 50;
  }
}



