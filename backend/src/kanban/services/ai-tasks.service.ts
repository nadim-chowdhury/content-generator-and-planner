import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class AiTasksService {
  private readonly logger = new Logger(AiTasksService.name);
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * Generate AI tasks for a card based on its content
   */
  async generateTasksForCard(cardId: string, userId: string): Promise<Array<{ text: string; priority: string }>> {
    const card = await this.prisma.kanbanCard.findFirst({
      where: { id: cardId, userId },
      include: {
        idea: {
          select: {
            title: true,
            description: true,
            platform: true,
            niche: true,
          },
        },
      },
    });

    if (!card) {
      throw new Error('Card not found');
    }

    try {
      const prompt = `Based on the following content card, generate a list of actionable tasks that need to be completed. 

Card Title: ${card.title}
Card Description: ${card.description || 'N/A'}
${card.idea ? `Linked Idea: ${card.idea.title} (Platform: ${card.idea.platform}, Niche: ${card.idea.niche})` : ''}
Stage: ${card.stage}

Generate 5-10 specific, actionable tasks. Each task should be clear and actionable. Return a JSON object with a "tasks" array. Each task should have:
- text: The task description
- priority: "high", "medium", or "low"

Focus on tasks relevant to the current stage and content type.`;

      const completion = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a productivity assistant. Generate actionable tasks for content creation workflows. Always return valid JSON.',
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
        throw new Error('Failed to generate tasks');
      }

      const data = JSON.parse(content);
      return data.tasks || [];
    } catch (error) {
      this.logger.error('Failed to generate AI tasks:', error);
      // Return fallback tasks
      return this.getFallbackTasks(card.stage);
    }
  }

  /**
   * Get fallback tasks based on stage
   */
  private getFallbackTasks(stage: string): Array<{ text: string; priority: string }> {
    const stageTasks: Record<string, Array<{ text: string; priority: string }>> = {
      IDEAS: [
        { text: 'Research trending topics', priority: 'high' },
        { text: 'Validate idea with audience', priority: 'medium' },
        { text: 'Check competitor content', priority: 'low' },
      ],
      DRAFTING: [
        { text: 'Write initial draft', priority: 'high' },
        { text: 'Create outline/structure', priority: 'high' },
        { text: 'Gather reference materials', priority: 'medium' },
      ],
      EDITING: [
        { text: 'Review and edit content', priority: 'high' },
        { text: 'Check grammar and spelling', priority: 'high' },
        { text: 'Optimize for platform', priority: 'medium' },
        { text: 'Add visuals/thumbnails', priority: 'medium' },
      ],
      READY: [
        { text: 'Final review', priority: 'high' },
        { text: 'Schedule publication', priority: 'high' },
        { text: 'Prepare captions and hashtags', priority: 'medium' },
      ],
      SCHEDULED: [
        { text: 'Prepare assets', priority: 'high' },
        { text: 'Set up automation', priority: 'medium' },
        { text: 'Double-check schedule', priority: 'low' },
      ],
      POSTED: [
        { text: 'Monitor engagement', priority: 'medium' },
        { text: 'Respond to comments', priority: 'high' },
        { text: 'Analyze performance', priority: 'low' },
      ],
    };

    return stageTasks[stage] || [];
  }
}

