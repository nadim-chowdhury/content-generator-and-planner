import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // Public endpoints
  @Get('posts')
  async getPublishedPosts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('category') category?: string,
  ) {
    return this.blogService.getPublishedPosts(
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 10,
      category,
    );
  }

  @Get('posts/:slug')
  async getPostBySlug(@Param('slug') slug: string) {
    return this.blogService.getPostBySlug(slug);
  }

  @Get('categories')
  async getCategories() {
    return this.blogService.getCategories();
  }

  // Author endpoints (authenticated)
  @Post('posts')
  @UseGuards(JwtAuthGuard)
  async createPost(
    @CurrentUser() user: any,
    @Body() data: {
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
    return this.blogService.createPost(user.id, data);
  }

  @Put('posts/:id')
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Param('id') postId: string,
    @CurrentUser() user: any,
    @Body() data: {
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
    return this.blogService.updatePost(postId, user.id, data);
  }

  @Get('my-posts')
  @UseGuards(JwtAuthGuard)
  async getMyPosts(@CurrentUser() user: any) {
    return this.blogService.getUserPosts(user.id);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  async deletePost(@Param('id') postId: string, @CurrentUser() user: any) {
    return this.blogService.deletePost(postId, user.id);
  }
}

