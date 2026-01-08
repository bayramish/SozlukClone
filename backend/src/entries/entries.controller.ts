import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { EntriesService } from './entries.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('entries')
export class EntriesController {
  constructor(private entriesService: EntriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createEntryDto: CreateEntryDto, @Request() req) {
    return this.entriesService.create(createEntryDto, req.user.id);
  }

  @Get()
  findAll(
    @Query('topicId') topicId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.entriesService.findAll(
      topicId ? parseInt(topicId, 10) : undefined,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.entriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateEntryDto: UpdateEntryDto, @Request() req) {
    return this.entriesService.update(id, updateEntryDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.entriesService.remove(id, req.user.id, req.user.role);
  }

  @Delete(':id/force')
  @UseGuards(JwtAuthGuard)
  forceRemove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // Only ADMIN and MODERATOR can force delete
    if (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR') {
      throw new ForbiddenException('Only admins and moderators can force delete entries');
    }
    return this.entriesService.forceRemove(id);
  }
}
