import { Controller, Get, Param, ParseIntPipe, Query, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Get('username/:username')
  findByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @Get('username/:username/entries')
  getUserEntries(
    @Param('username') username: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getUserEntries(
      username,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('username/:username/top-entries')
  getTopEntries(
    @Param('username') username: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getTopEntries(
      username,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Request() req,
    @Body() updateData: { email?: string; password?: string },
  ) {
    return this.usersService.updateProfile(req.user.id, updateData);
  }
}
