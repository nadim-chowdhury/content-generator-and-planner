import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScriptGeneratorDto, ScriptType } from './dto/script-generator.dto';
import { RewriteDto } from './dto/rewrite.dto';
import { ElaborateIdeaDto } from './dto/elaborate-idea.dto';
import { OptimizeTitleDto } from './dto/optimize-title.dto';
import { CalendarAutofillDto } from './dto/calendar-autofill.dto';
import { CompetitorAnalysisDto } from './dto/competitor-analysis.dto';
import { NicheResearchDto } from './dto/niche-research.dto';
import { TrendingTopicsDto } from './dto/trending-topics.dto';
import { AudiencePersonaDto } from './dto/audience-persona.dto';
import { ViralScoreDto } from './dto/viral-score.dto';
import { LanguageService } from '../ideas/services/language.service';
import { OpenAIService } from '../common/openai/openai.service';

@Injectable()
export class AiToolsService {
  constructor(
    private configService: ConfigService,
    private languageService: LanguageService,
    private openaiService: OpenAIService,
  ) {}

  /**
   * Generate script (short or long form)
   */
  async generateScript(dto: ScriptGeneratorDto) {
    const language = dto.language && this.languageService.isSupported(dto.language)
      ? dto.language
      : this.languageService.getDefaultLanguage();

    const scriptType = dto.type === ScriptType.SHORT ? 'short-form' : 'long-form';
    const duration = dto.targetDuration || (dto.type === ScriptType.SHORT ? 30 : 600);

    const prompt = `Generate a ${scriptType} video script for the topic: "${dto.topic}"

${dto.platform ? `Platform: ${dto.platform}` : ''}
${dto.tone ? `Tone: ${dto.tone}` : ''}
Target Duration: ${duration} seconds
${dto.additionalContext ? `Additional Context: ${dto.additionalContext}` : ''}

${this.languageService.getLanguageInstruction(language)}

Requirements:
- ${dto.type === ScriptType.SHORT ? 'Keep it concise and engaging (15-60 seconds)' : 'Create a detailed, structured script (5+ minutes)'}
- Include a strong hook in the first 3-5 seconds
- Structure with clear sections
- Include transitions between sections
- Add call-to-action at the end
- Make it engaging and platform-appropriate

Return a JSON object with:
- hook: Opening hook (1-2 sentences)
- script: Full script with timestamps or sections
- keyPoints: Array of main points covered
- cta: Call-to-action text`;

    try {
      const completion = await this.openaiService.createChatCompletion({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: `I'm a content creator who needs help writing ${scriptType} video scripts. Write naturally, like you're helping a friend brainstorm ideas. Make the scripts sound authentic and conversational, not robotic or overly formal.` 
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.9,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new BadRequestException('Failed to generate script');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new BadRequestException('Failed to generate script. Please try again.');
    }
  }

  /**
   * Rewrite content
   */
  async rewriteContent(dto: RewriteDto) {
    const language = dto.language && this.languageService.isSupported(dto.language)
      ? dto.language
      : this.languageService.getDefaultLanguage();

    const prompt = `Rewrite the following content:

Original Content:
${dto.content}

${dto.style ? `Style: ${dto.style}` : ''}
${dto.targetAudience ? `Target Audience: ${dto.targetAudience}` : ''}
${dto.platform ? `Platform: ${dto.platform}` : ''}
${dto.additionalInstructions ? `Additional Instructions: ${dto.additionalInstructions}` : ''}

${this.languageService.getLanguageInstruction(language)}

Return a JSON object with:
- rewritten: The rewritten content
- improvements: Array of improvements made
- wordCount: Word count of rewritten content`;

    try {
      const completion = await this.openaiService.createChatCompletion({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o',
        messages: [
          { role: 'system', content: 'I need help rewriting some content to make it sound more natural and engaging. Write it like a real person would, not like a corporate robot. Keep it authentic and conversational.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.9,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new BadRequestException('Failed to rewrite content');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new BadRequestException('Failed to rewrite content. Please try again.');
    }
  }

  /**
   * Elaborate on an idea
   */
  async elaborateIdea(dto: ElaborateIdeaDto) {
    const language = dto.language && this.languageService.isSupported(dto.language)
      ? dto.language
      : this.languageService.getDefaultLanguage();

    const prompt = `Elaborate and expand on this content idea:

Idea: "${dto.idea}"

${dto.platform ? `Platform: ${dto.platform}` : ''}
${dto.niche ? `Niche: ${dto.niche}` : ''}
${dto.additionalContext ? `Additional Context: ${dto.additionalContext}` : ''}

${this.languageService.getLanguageInstruction(language)}

Return a JSON object with:
- expandedIdea: Detailed elaboration of the idea
- keyPoints: Array of main points to cover
- contentStructure: Suggested structure for the content
- hashtags: Array of relevant hashtags
- estimatedDuration: Estimated duration in seconds (if applicable)`;

    try {
      const completion = await this.openaiService.createChatCompletion({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o',
        messages: [
          { role: 'system', content: 'I\'m brainstorming content ideas and need help expanding on this one. Think like a real creator would - what would make this idea actually interesting and relatable? Make it feel authentic.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.9,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new BadRequestException('Failed to elaborate idea');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new BadRequestException('Failed to elaborate idea. Please try again.');
    }
  }

  /**
   * Optimize title
   */
  async optimizeTitle(dto: OptimizeTitleDto) {
    const language = dto.language && this.languageService.isSupported(dto.language)
      ? dto.language
      : this.languageService.getDefaultLanguage();

    const variations = dto.variations || 5;

    const prompt = `Optimize and generate variations of this title:

Original Title: "${dto.title}"

${dto.platform ? `Platform: ${dto.platform}` : ''}
${dto.niche ? `Niche: ${dto.niche}` : ''}
${dto.additionalContext ? `Additional Context: ${dto.additionalContext}` : ''}

${this.languageService.getLanguageInstruction(language)}

Generate ${variations} optimized title variations. Return a JSON object with:
- variations: Array of ${variations} optimized titles
- analysis: Analysis of what makes each title effective
- recommendations: Best practices for this platform/niche`;

    try {
      const completion = await this.openaiService.createChatCompletion({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o',
        messages: [
          { role: 'system', content: 'I need help making this title better. Give me variations that sound natural and click-worthy, not clickbait. Think about what would make a real person want to click, not what an algorithm wants.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.9,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new BadRequestException('Failed to optimize title');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new BadRequestException('Failed to optimize title. Please try again.');
    }
  }

  /**
   * Auto-fill content calendar
   */
  async autofillCalendar(dto: CalendarAutofillDto) {
    const language = dto.language && this.languageService.isSupported(dto.language)
      ? dto.language
      : this.languageService.getDefaultLanguage();

    const postsPerWeek = dto.postsPerWeek || 5;
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPosts = Math.ceil((daysDiff / 7) * postsPerWeek);

    const prompt = `Generate a content calendar with ${totalPosts} content ideas for the period from ${dto.startDate} to ${dto.endDate}.

Platform: ${dto.platform}
Niche: ${dto.niche}
${dto.tone ? `Tone: ${dto.tone}` : ''}
Posts per week: ${postsPerWeek}
${dto.additionalContext ? `Additional Context: ${dto.additionalContext}` : ''}

${this.languageService.getLanguageInstruction(language)}

Return a JSON object with:
- calendar: Array of content ideas, each with:
  - date: Suggested date (YYYY-MM-DD)
  - title: Content title
  - description: Brief description
  - type: Content type (video, post, reel, etc.)
  - hashtags: Array of relevant hashtags
- strategy: Overall content strategy for this period
- themes: Weekly or monthly themes`;

    try {
      const completion = await this.openaiService.createChatCompletion({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o',
        messages: [
          { role: 'system', content: 'I\'m planning my content calendar and need ideas that feel authentic and varied. Don\'t make everything sound the same - mix it up like a real creator would. Make it feel natural.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.9,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new BadRequestException('Failed to generate calendar');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new BadRequestException('Failed to generate calendar. Please try again.');
    }
  }

  /**
   * Competitor analysis
   */
  async analyzeCompetitors(dto: CompetitorAnalysisDto) {
    const language = dto.language && this.languageService.isSupported(dto.language)
      ? dto.language
      : this.languageService.getDefaultLanguage();

    const prompt = `Analyze competitors in the "${dto.niche}" niche.

${dto.platform ? `Platform: ${dto.platform}` : 'All platforms'}
${dto.competitors && dto.competitors.length > 0 ? `Specific Competitors: ${dto.competitors.join(', ')}` : ''}

${this.languageService.getLanguageInstruction(language)}

Return a JSON object with:
- topCompetitors: Array of top competitors with:
  - name: Competitor name
  - strengths: Array of strengths
  - contentStrategy: Their content strategy
  - engagementRate: Estimated engagement rate
- trends: Common trends in competitor content
- opportunities: Opportunities to differentiate
- bestPractices: Best practices to adopt
- gaps: Content gaps in the niche`;

    try {
      const completion = await this.openaiService.createChatCompletion({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o',
        messages: [
          { role: 'system', content: 'I want to understand what my competitors are doing, but analyze it like a real person would - what\'s actually working, what feels authentic, what\'s just noise. Give me insights that matter.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.85,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new BadRequestException('Failed to analyze competitors');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new BadRequestException('Failed to analyze competitors. Please try again.');
    }
  }

  /**
   * Niche research
   */
  async researchNiche(dto: NicheResearchDto) {
    const language = dto.language && this.languageService.isSupported(dto.language)
      ? dto.language
      : this.languageService.getDefaultLanguage();

    const prompt = `Conduct comprehensive research on the "${dto.niche}" niche.

${dto.platform ? `Platform: ${dto.platform}` : 'All platforms'}
${dto.additionalContext ? `Additional Context: ${dto.additionalContext}` : ''}

${this.languageService.getLanguageInstruction(language)}

Return a JSON object with:
- nicheOverview: Overview of the niche
- targetAudience: Target audience demographics and interests
- contentTypes: Popular content types in this niche
- trendingTopics: Current trending topics
- hashtags: Popular hashtags in this niche
- competitors: Top competitors in this niche
- opportunities: Content opportunities
- challenges: Challenges in this niche
- growthPotential: Growth potential analysis
- monetization: Monetization opportunities`;

    try {
      const completion = await this.openaiService.createChatCompletion({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o',
        messages: [
          { role: 'system', content: 'I\'m researching this niche and need real insights, not generic market research. Tell me what\'s actually happening, what real creators are doing, and what opportunities exist. Be specific and authentic.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.85,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new BadRequestException('Failed to research niche');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new BadRequestException('Failed to research niche. Please try again.');
    }
  }

  /**
   * Generate trending topics
   */
  async generateTrendingTopics(dto: TrendingTopicsDto) {
    const language = dto.language && this.languageService.isSupported(dto.language)
      ? dto.language
      : this.languageService.getDefaultLanguage();

    const count = dto.count || 10;
    const timeFrame = dto.timeFrame || 'weekly';

    const prompt = `Generate ${count} trending topics in the "${dto.niche}" niche.

${dto.platform ? `Platform: ${dto.platform}` : 'All platforms'}
Time Frame: ${timeFrame}
${this.languageService.getLanguageInstruction(language)}

Return a JSON object with:
- topics: Array of ${count} trending topics, each with:
  - title: Topic title
  - description: Brief description
  - trendScore: Trend score (0-100)
  - hashtags: Relevant trending hashtags
  - contentIdeas: 2-3 content ideas for this topic
  - whyTrending: Why this topic is trending
- overallTrends: Overall trend patterns in this niche`;

    try {
      const completion = await this.openaiService.createChatCompletion({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o',
        messages: [
          { role: 'system', content: 'I want to know what\'s actually trending right now, not what some algorithm says. Give me real trends that real people are talking about. Make it feel current and authentic.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.9,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new BadRequestException('Failed to generate trending topics');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new BadRequestException('Failed to generate trending topics. Please try again.');
    }
  }

  /**
   * Build audience persona
   */
  async buildAudiencePersona(dto: AudiencePersonaDto) {
    const language = dto.language && this.languageService.isSupported(dto.language)
      ? dto.language
      : this.languageService.getDefaultLanguage();

    const prompt = `Create a detailed audience persona for the "${dto.niche}" niche.

${dto.platform ? `Platform: ${dto.platform}` : 'All platforms'}
${dto.additionalContext ? `Additional Context: ${dto.additionalContext}` : ''}

${this.languageService.getLanguageInstruction(language)}

Return a JSON object with:
- persona: {
    - name: Persona name
    - age: Age range
    - gender: Gender demographics
    - location: Geographic location
    - interests: Array of interests
    - painPoints: Array of pain points
    - goals: Array of goals
    - contentPreferences: Preferred content types
    - activePlatforms: Platforms they use
    - engagementPatterns: When and how they engage
    - values: Core values
    - buyingBehavior: Buying behavior patterns
  }
- contentStrategy: Content strategy recommendations for this persona
- messaging: Recommended messaging approach`;

    try {
      const completion = await this.openaiService.createChatCompletion({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o',
        messages: [
          { role: 'system', content: 'I need to understand my audience better. Create a persona that feels like a real person, not a marketing stereotype. What would this person actually care about? How do they really behave? Be authentic.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.85,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new BadRequestException('Failed to build audience persona');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new BadRequestException('Failed to build audience persona. Please try again.');
    }
  }

  /**
   * Predict viral score
   */
  async predictViralScore(dto: ViralScoreDto) {
    const language = dto.language && this.languageService.isSupported(dto.language)
      ? dto.language
      : this.languageService.getDefaultLanguage();

    const prompt = `Analyze and predict the viral potential (0-100 score) for this content:

Title: "${dto.title}"
${dto.description ? `Description: ${dto.description}` : ''}
${dto.hook ? `Hook: ${dto.hook}` : ''}
${dto.caption ? `Caption: ${dto.caption}` : ''}
${dto.hashtags && dto.hashtags.length > 0 ? `Hashtags: ${dto.hashtags.join(', ')}` : ''}
Platform: ${dto.platform}
${dto.niche ? `Niche: ${dto.niche}` : ''}

${this.languageService.getLanguageInstruction(language)}

Return a JSON object with:
- viralScore: Number 0-100 (viral potential score)
- breakdown: {
    - titleScore: Score for title (0-100)
    - hookScore: Score for hook (0-100)
    - contentScore: Score for content quality (0-100)
    - hashtagScore: Score for hashtag strategy (0-100)
    - platformOptimization: Score for platform optimization (0-100)
  }
- strengths: Array of strengths that increase viral potential
- weaknesses: Array of weaknesses that decrease viral potential
- recommendations: Array of recommendations to improve viral score
- trendAlignment: How well it aligns with current trends (0-100)
- engagementPotential: Estimated engagement potential (0-100)`;

    try {
      const completion = await this.openaiService.createChatCompletion({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o',
        messages: [
          { role: 'system', content: 'I want an honest assessment of whether this content could go viral. Be realistic - not everything goes viral. Tell me what would actually work and what wouldn\'t, like a real creator would analyze it.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.85, // Balanced temperature for realistic scoring
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new BadRequestException('Failed to predict viral score');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new BadRequestException('Failed to predict viral score. Please try again.');
    }
  }
}



