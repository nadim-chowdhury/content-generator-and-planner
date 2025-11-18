import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

// Dynamic import for canvas (optional dependency)
let canvas: any;
try {
  canvas = require('canvas');
} catch (error) {
  // Canvas not installed - will throw error when used
}

@Injectable()
export class SharingService {
  private readonly logger = new Logger(SharingService.name);
  private readonly imageWidth = 1200;
  private readonly imageHeight = 630; // Standard social media image size

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate shareable image for an idea
   */
  async generateIdeaImage(ideaId: string): Promise<Buffer> {
    if (!canvas) {
      throw new ServiceUnavailableException('Image generation service is not available. Please install canvas package.');
    }

    const idea = await this.prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        user: {
          select: {
            name: true,
            profileImage: true,
          },
        },
      },
    });

    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    // Create canvas
    const canvasInstance = canvas.createCanvas(this.imageWidth, this.imageHeight);
    const ctx = canvasInstance.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, this.imageWidth, this.imageHeight);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.imageWidth, this.imageHeight);

    // Add overlay for better text readability
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, this.imageWidth, this.imageHeight);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Wrap text
    const title = this.wrapText(ctx, idea.title, this.imageWidth - 200, 48);
    const titleY = 100;
    title.lines.forEach((line, index) => {
      ctx.fillText(line, this.imageWidth / 2, titleY + index * 60);
    });

    // Description (truncated)
    if (idea.description) {
      ctx.font = '32px Arial';
      const description = this.truncateText(idea.description, 100);
      const descY = titleY + title.lines.length * 60 + 40;
      ctx.fillText(description, this.imageWidth / 2, descY);
    }

    // Platform and niche
    ctx.font = '24px Arial';
    const platformY = this.imageHeight - 150;
    ctx.fillText(`Platform: ${idea.platform}`, this.imageWidth / 2, platformY);
    ctx.fillText(`Niche: ${idea.niche}`, this.imageWidth / 2, platformY + 40);

    // Branding
    ctx.font = '20px Arial';
    ctx.fillText('Content Generator & Planner', this.imageWidth / 2, this.imageHeight - 50);

    // Convert to buffer
    return canvasInstance.toBuffer('image/png');
  }

  /**
   * Generate content card image
   */
  async generateContentCard(data: {
    title: string;
    content: string;
    platform?: string;
    author?: string;
  }): Promise<Buffer> {
    if (!canvas) {
      throw new ServiceUnavailableException('Image generation service is not available. Please install canvas package.');
    }

    const canvasInstance = canvas.createCanvas(this.imageWidth, this.imageHeight);
    const ctx = canvasInstance.getContext('2d');

    // Background
    const gradient = ctx.createLinearGradient(0, 0, this.imageWidth, this.imageHeight);
    gradient.addColorStop(0, '#f093fb');
    gradient.addColorStop(1, '#4facfe');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.imageWidth, this.imageHeight);

    // White card background
    const cardPadding = 40;
    const cardX = cardPadding;
    const cardY = cardPadding;
    const cardWidth = this.imageWidth - cardPadding * 2;
    const cardHeight = this.imageHeight - cardPadding * 2;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

    // Title
    ctx.fillStyle = '#1a202c';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const titleY = cardY + 60;
    const titleWrap = this.wrapText(ctx, data.title, cardWidth - 120, 42);
    titleWrap.lines.forEach((line, index) => {
      ctx.fillText(line, cardX + 60, titleY + index * 55);
    });

    // Content
    ctx.font = '28px Arial';
    ctx.fillStyle = '#4a5568';
    const contentY = titleY + titleWrap.lines.length * 55 + 40;
    const contentWrap = this.wrapText(ctx, data.content, cardWidth - 120, 28);
    contentWrap.lines.slice(0, 8).forEach((line, index) => {
      ctx.fillText(line, cardX + 60, contentY + index * 40);
    });

    // Platform and author
    if (data.platform || data.author) {
      ctx.font = '20px Arial';
      ctx.fillStyle = '#718096';
      const footerY = cardY + cardHeight - 60;
      if (data.platform) {
        ctx.fillText(`Platform: ${data.platform}`, cardX + 60, footerY);
      }
      if (data.author) {
        ctx.textAlign = 'right';
        ctx.fillText(`By ${data.author}`, cardX + cardWidth - 60, footerY);
        ctx.textAlign = 'left';
      }
    }

    return canvasInstance.toBuffer('image/png');
  }

  /**
   * Helper: Wrap text to fit width
   */
  private wrapText(
    ctx: any,
    text: string,
    maxWidth: number,
    fontSize: number,
  ): { lines: string[]; height: number } {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);

    return {
      lines,
      height: lines.length * fontSize * 1.2,
    };
  }

  /**
   * Helper: Truncate text
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}

