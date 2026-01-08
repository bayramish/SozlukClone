import { Controller, Post, Body, Get, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('votes')
export class VotesController {
  constructor(private votesService: VotesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createVoteDto: CreateVoteDto, @Request() req) {
    return this.votesService.create(createVoteDto, req.user.id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('entry/:entryId')
  getEntryVotes(@Param('entryId', ParseIntPipe) entryId: number, @Request() req: any) {
    // JWT guard optional - giriş yapmamış kullanıcılar da oy sayısını görebilir
    const userId = req?.user?.id;
    return this.votesService.getEntryVotes(entryId, userId);
  }
}
