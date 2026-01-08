import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, UseGuards, Request, Delete, ForbiddenException } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('topics')
export class TopicsController {
  constructor(private topicsService: TopicsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createTopicDto: CreateTopicDto, @Request() req) {
    return this.topicsService.create(createTopicDto, req.user.id);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.topicsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('search/query')
  search(@Query('q') query: string) {
    return this.topicsService.search(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.topicsService.findOne(slug);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // Only ADMIN and MODERATOR can delete topics
    if (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR') {
      throw new ForbiddenException('Only admins and moderators can delete topics');
    }
    return this.topicsService.remove(id);
  }
}
