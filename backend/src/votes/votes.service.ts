import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateVoteDto } from './dto/create-vote.dto';

@Injectable()
export class VotesService {
  constructor(private prisma: PrismaService) {}

  async create(createVoteDto: CreateVoteDto, userId: number) {
    // Entry'nin var olduğunu kontrol et
    const entry = await this.prisma.entry.findUnique({
      where: { id: createVoteDto.entryId },
    });

    if (!entry || entry.isDeleted) {
      throw new NotFoundException('Entry not found');
    }

    // Kullanıcı kendi entry'sine oy veremez
    if (entry.userId === userId) {
      throw new ConflictException('You cannot vote on your own entry');
    }

    // Daha önce oy verilmiş mi kontrol et
    const existingVote = await this.prisma.vote.findUnique({
      where: {
        entryId_userId: {
          entryId: createVoteDto.entryId,
          userId,
        },
      },
    });

    if (existingVote) {
      // Eğer aynı oy tekrar verilirse, oyu kaldır
      if (existingVote.value === createVoteDto.value) {
        await this.prisma.vote.delete({
          where: {
            entryId_userId: {
              entryId: createVoteDto.entryId,
              userId,
            },
          },
        });
        const voteSumAfter = await this.prisma.vote.aggregate({
          where: { entryId: createVoteDto.entryId },
          _sum: { value: true },
        });
        return { 
          message: 'Vote removed', 
          vote: null,
          total: voteSumAfter._sum.value || 0,
        };
      } else {
        // Farklı oy verilirse, oyu güncelle
        const updated = await this.prisma.vote.update({
          where: {
            entryId_userId: {
              entryId: createVoteDto.entryId,
              userId,
            },
          },
          data: {
            value: createVoteDto.value,
          },
        });
        const voteSumAfter = await this.prisma.vote.aggregate({
          where: { entryId: createVoteDto.entryId },
          _sum: { value: true },
        });
        return {
          ...updated,
          total: voteSumAfter._sum.value || 0,
        };
      }
    }

    // Yeni oy oluştur
    const created = await this.prisma.vote.create({
      data: {
        entryId: createVoteDto.entryId,
        userId,
        value: createVoteDto.value,
      },
    });
    const voteSumAfter = await this.prisma.vote.aggregate({
      where: { entryId: createVoteDto.entryId },
      _sum: { value: true },
    });
    return {
      ...created,
      total: voteSumAfter._sum.value || 0,
    };
  }

  async getEntryVotes(entryId: number, userId?: number) {
    const voteSum = await this.prisma.vote.aggregate({
      where: { entryId },
      _sum: {
        value: true,
      },
      _count: {
        value: true,
      },
    });

    let userVote = null;
    if (userId) {
      const userVoteRecord = await this.prisma.vote.findUnique({
        where: {
          entryId_userId: {
            entryId,
            userId,
          },
        },
      });
      userVote = userVoteRecord ? userVoteRecord.value : null;
    }
    
    return {
      total: voteSum._sum.value || 0,
      count: voteSum._count.value || 0,
      userVote,
    };
  }
}
