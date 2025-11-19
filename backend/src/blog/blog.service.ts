import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Create a blog post
   */
  async createPost(
    authorId: string,
    data: {
      title: string;
      excerpt?: string;
      content: string;
      featuredImage?: string;
      category?: string;
      tags?: string[];
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string[];
      ogImage?: string;
      status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    },
  ) {
    const slug = this.generateSlug(data.title);

    // Check if slug exists
    const existing = await this.prisma.blogPost.findUnique({
      where: { slug },
    });

    let finalSlug = slug;
    if (existing) {
      // Append timestamp to make it unique
      finalSlug = `${slug}-${Date.now()}`;
    }

    const post = await this.prisma.blogPost.create({
      data: {
        ...data,
        slug: finalSlug,
        authorId,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    this.logger.log(`Blog post created: ${post.id}`);
    return post;
  }

  /**
   * Update a blog post
   */
  async updatePost(
    postId: string,
    authorId: string,
    data: {
      title?: string;
      excerpt?: string;
      content?: string;
      featuredImage?: string;
      category?: string;
      tags?: string[];
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string[];
      ogImage?: string;
      status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    },
  ) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    if (post.authorId !== authorId) {
      throw new BadRequestException('You can only edit your own posts');
    }

    const updateData: any = { ...data };

    // If title changed, update slug
    if (data.title && data.title !== post.title) {
      const newSlug = this.generateSlug(data.title);
      const existing = await this.prisma.blogPost.findUnique({
        where: { slug: newSlug },
      });
      updateData.slug = existing ? `${newSlug}-${Date.now()}` : newSlug;
    }

    // If status changed to PUBLISHED, set publishedAt
    if (data.status === 'PUBLISHED' && post.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date();
    }

    const updated = await this.prisma.blogPost.update({
      where: { id: postId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    this.logger.log(`Blog post updated: ${postId}`);
    return updated;
  }

  /**
   * Get published blog posts (public)
   */
  async getPublishedPosts(page: number = 1, limit: number = 10, category?: string) {
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'PUBLISHED',
    };

    if (category) {
      where.category = category;
    }

    const [posts, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get blog post by slug (public)
   */
  async getPostBySlug(slug: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    if (!post || post.status !== 'PUBLISHED') {
      throw new NotFoundException('Blog post not found');
    }

    // Increment views
    await this.prisma.blogPost.update({
      where: { id: post.id },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    return {
      ...post,
      views: post.views + 1,
    };
  }

  /**
   * Get blog categories
   */
  async getCategories() {
    const posts = await this.prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { category: true },
    });

    const categories = posts
      .map((p) => p.category)
      .filter((c): c is string => !!c);

    const categoryCounts = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
    }));
  }

  /**
   * Get user's blog posts (for author)
   */
  async getUserPosts(userId: string) {
    return this.prisma.blogPost.findMany({
      where: { authorId: userId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete blog post
   */
  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    if (post.authorId !== userId) {
      throw new BadRequestException('You can only delete your own posts');
    }

    await this.prisma.blogPost.delete({
      where: { id: postId },
    });

    this.logger.log(`Blog post deleted: ${postId}`);
    return { message: 'Blog post deleted' };
  }
}


