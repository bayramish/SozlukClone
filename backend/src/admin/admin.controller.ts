import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // User Management
  @Get('users')
  getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
  }

  @Get('users/:id')
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('role') role: 'USER' | 'MODERATOR' | 'ADMIN',
  ) {
    return this.adminService.updateUserRole(id, role);
  }

  @Delete('users/:id')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  // Topic Management
  @Patch('topics/:id/move')
  moveTopic(
    @Param('id', ParseIntPipe) id: number,
    @Body('newTitle') newTitle: string,
  ) {
    return this.adminService.moveTopic(id, newTitle);
  }

  @Post('topics/:sourceId/merge/:targetId')
  mergeTopics(
    @Param('sourceId', ParseIntPipe) sourceId: number,
    @Param('targetId', ParseIntPipe) targetId: number,
  ) {
    return this.adminService.mergeTopics(sourceId, targetId);
  }

  @Delete('topics/:id')
  deleteTopic(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteTopic(id);
  }

  // Entry Management
  @Patch('entries/:id/move')
  moveEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body('newTopicId') newTopicId: number,
  ) {
    return this.adminService.moveEntry(id, newTopicId);
  }

  @Delete('entries/:id/force')
  forceDeleteEntry(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.forceDeleteEntry(id);
  }

  // Statistics
  @Get('stats')
  getStatistics() {
    return this.adminService.getStatistics();
  }

  // Activity Log
  @Get('activity')
  getActivityLog(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getActivityLog(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  // Permission Management
  @Get('permissions/:userId')
  getModeratorPermissions(@Param('userId', ParseIntPipe) userId: number) {
    return this.adminService.getModeratorPermissions(userId);
  }

  @Patch('permissions/:userId')
  updateModeratorPermissions(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() permissions: {
      canDeleteEntry?: boolean;
      canDeleteTopic?: boolean;
      canBanUser?: boolean;
      canEditEntry?: boolean;
      canMoveEntry?: boolean;
      canMergeTopic?: boolean;
    },
  ) {
    return this.adminService.updateModeratorPermissions(userId, permissions);
  }

  // Ban Management
  @Post('ban/:userId')
  banUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body('reason') reason: string,
    @Body('until') until?: string,
  ) {
    return this.adminService.banUser(
      userId,
      reason,
      until ? new Date(until) : undefined,
    );
  }

  @Post('unban/:userId')
  unbanUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.adminService.unbanUser(userId);
  }

  @Get('banned-users')
  getBannedUsers() {
    return this.adminService.getBannedUsers();
  }
}
