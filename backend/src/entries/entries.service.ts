import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';

@Injectable()
export class EntriesService {
  constructor(private prisma: PrismaService) {}

  async create(createEntryDto: CreateEntryDto, userId: number) {
    // Check if user is banned
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true, bannedUntil: true, banReason: true },
    });

    if (user?.isBanned) {
      if (user.bannedUntil && user.bannedUntil < new Date()) {
        // Ban expired, auto-unban
        await this.prisma.user.update({
          where: { id: userId },
          data: { isBanned: false, bannedUntil: null, banReason: null },
        });
      } else {
        const message = user.bannedUntil
          ? `You are banned until ${user.bannedUntil.toLocaleDateString()}. Reason: ${user.banReason}`
          : `You are permanently banned. Reason: ${user.banReason}`;
        throw new ForbiddenException(message);
      }
    }

    // Topic'in var olduğunu kontrol et
    const topic = await this.prisma.topic.findUnique({
      where: { id: createEntryDto.topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return this.prisma.entry.create({
      data: {
        content: createEntryDto.content,
        topicId: createEntryDto.topicId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        topic: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });
  }

  async findAll(topicId?: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where = topicId ? { topicId, isDeleted: false } : { isDeleted: false };

    const [entries, total] = await Promise.all([
      this.prisma.entry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          topic: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          _count: {
            select: {
              votes: true,
            },
          },
        },
      }),
      this.prisma.entry.count({ where }),
    ]);

    // Her entry için vote toplamını hesapla
    const entriesWithVotes = await Promise.all(
      entries.map(async (entry) => {
        const voteSum = await this.prisma.vote.aggregate({
          where: { entryId: entry.id },
          _sum: {
            value: true,
          },
          _count: {
            value: true,
          },
        });

        return {
          ...entry,
          voteCount: voteSum._sum.value || 0,
          voteTotal: voteSum._count.value || 0,
        };
      }),
    );

    return {
      entries: entriesWithVotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const entry = await this.prisma.entry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        topic: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    if (!entry || entry.isDeleted) {
      throw new NotFoundException('Entry not found');
    }

    const voteSum = await this.prisma.vote.aggregate({
      where: { entryId: id },
      _sum: {
        value: true,
      },
      _count: {
        value: true,
      },
    });

    return {
      ...entry,
      voteCount: voteSum._sum.value || 0,
      voteTotal: voteSum._count.value || 0,
    };
  }

  async update(id: number, updateEntryDto: UpdateEntryDto, userId: number) {
    const entry = await this.prisma.entry.findUnique({
      where: { id },
    });

    if (!entry || entry.isDeleted) {
      throw new NotFoundException('Entry not found');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException('You can only update your own entries');
    }

    return this.prisma.entry.update({
      where: { id },
      data: updateEntryDto,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        topic: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });
  }

  async remove(id: number, userId: number, userRole: string) {
    const entry = await this.prisma.entry.findUnique({
      where: { id },
    });

    if (!entry || entry.isDeleted) {
      throw new NotFoundException('Entry not found');
    }

    // Kullanıcı kendi entry'sini silebilir veya moderator/admin herhangi bir entry'yi silebilir
    if (entry.userId !== userId && userRole !== 'MODERATOR' && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own entries');
    }

    return this.prisma.entry.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async forceRemove(id: number) {
    const entry = await this.prisma.entry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    // Delete votes first
    await this.prisma.vote.deleteMany({ where: { entryId: id } });

    // Hard delete the entry
    await this.prisma.entry.delete({ where: { id } });

    return { message: 'Entry permanently deleted' };
  }
}
