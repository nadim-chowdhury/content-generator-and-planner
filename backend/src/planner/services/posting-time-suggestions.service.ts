import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface PostingTimeSuggestion {
  date: string; // ISO date string
  time: string; // HH:mm format
  dayOfWeek: string; // e.g., "Monday"
  score: number; // 0-100, indicating how optimal this time is
  reason: string; // Why this time is suggested
  expectedEngagement: string; // Expected engagement level
}

@Injectable()
export class PostingTimeSuggestionsService {
  private readonly logger = new Logger(PostingTimeSuggestionsService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * Get optimal posting times based on platform, niche, and audience
   */
  async getOptimalPostingTimes(
    platform: string,
    niche: string,
    timezone?: string,
    daysAhead: number = 7,
  ): Promise<PostingTimeSuggestion[]> {
    try {
      const prompt = `You are an expert social media strategist. Based on the following information, suggest the best posting times for maximum engagement.

Platform: ${platform}
Niche: ${niche}
Timezone: ${timezone || 'UTC'}
Days to analyze: ${daysAhead}

Please provide optimal posting times for the next ${daysAhead} days. Consider:
- Platform-specific best practices
- Audience behavior patterns for this niche
- Day of week patterns
- Time of day patterns
- Industry benchmarks

Return a JSON object with a "suggestions" array. Each suggestion should have:
- date: ISO date string (YYYY-MM-DD)
- time: Time in HH:mm format (24-hour)
- dayOfWeek: Day name (e.g., "Monday")
- score: Number 0-100 indicating optimality
- reason: Brief explanation (1-2 sentences)
- expectedEngagement: Expected engagement level (e.g., "High", "Medium", "Low")

Provide 3-5 suggestions per day, focusing on the most optimal times.`;

      const completion = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert social media strategist specializing in optimal posting times. Always return valid JSON.',
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
        throw new Error('Failed to generate posting time suggestions');
      }

      const data = JSON.parse(content);
      return data.suggestions || this.getFallbackSuggestions(daysAhead);
    } catch (error) {
      this.logger.error('Failed to get AI posting time suggestions:', error);
      // Return fallback suggestions based on platform best practices
      return this.getFallbackSuggestions(daysAhead, platform);
    }
  }

  /**
   * Get fallback suggestions based on platform best practices
   */
  private getFallbackSuggestions(daysAhead: number, platform?: string): PostingTimeSuggestion[] {
    const suggestions: PostingTimeSuggestion[] = [];
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Platform-specific default times (in UTC, can be adjusted)
    const platformDefaults: Record<string, { times: string[]; bestDays: number[] }> = {
      'Instagram': { times: ['11:00', '14:00', '17:00'], bestDays: [1, 2, 3, 4, 5] }, // Mon-Fri
      'Instagram Reels': { times: ['09:00', '12:00', '19:00'], bestDays: [1, 2, 3, 4, 5, 6] },
      'Facebook': { times: ['13:00', '15:00', '18:00'], bestDays: [1, 2, 3, 4, 5] },
      'Facebook Reels': { times: ['10:00', '14:00', '20:00'], bestDays: [1, 2, 3, 4, 5, 6] },
      'Twitter': { times: ['08:00', '12:00', '17:00'], bestDays: [1, 2, 3, 4, 5] },
      'LinkedIn': { times: ['08:00', '12:00', '17:00'], bestDays: [1, 2, 3, 4, 5] },
      'TikTok': { times: ['09:00', '12:00', '19:00'], bestDays: [1, 2, 3, 4, 5, 6] },
      'YouTube': { times: ['14:00', '18:00', '20:00'], bestDays: [1, 2, 3, 4, 5, 6] },
      'YouTube Shorts': { times: ['09:00', '12:00', '19:00'], bestDays: [1, 2, 3, 4, 5, 6] },
    };

    const defaults = platformDefaults[platform || 'Instagram'] || platformDefaults['Instagram'];

    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      const dayName = dayNames[dayOfWeek];

      // Only suggest times for best days, or all days if no specific best days
      if (defaults.bestDays.includes(dayOfWeek) || defaults.bestDays.length === 0) {
        defaults.times.forEach((time, index) => {
          const score = defaults.bestDays.includes(dayOfWeek) ? 80 - (index * 10) : 60 - (index * 10);
          suggestions.push({
            date: date.toISOString().split('T')[0],
            time,
            dayOfWeek: dayName,
            score: Math.max(50, score),
            reason: `Optimal posting time for ${platform || 'social media'} based on audience engagement patterns. ${dayName} typically shows good engagement.`,
            expectedEngagement: score >= 70 ? 'High' : score >= 60 ? 'Medium' : 'Low',
          });
        });
      }
    }

    // Sort by score descending
    return suggestions.sort((a, b) => b.score - a.score);
  }

  /**
   * Get best posting time for a specific idea
   */
  async getBestTimeForIdea(
    ideaId: string,
    platform: string,
    niche: string,
    timezone?: string,
  ): Promise<PostingTimeSuggestion | null> {
    const suggestions = await this.getOptimalPostingTimes(platform, niche, timezone, 7);
    if (suggestions.length === 0) return null;

    // Return the highest scoring suggestion
    return suggestions[0];
  }
}


