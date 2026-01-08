import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTopicDto } from './dto/create-topic.dto';

@Injectable()
export class TopicsService {
  constructor(private prisma: PrismaService) {}

  async create(createTopicDto: CreateTopicDto, userId: number) {
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

    const slug = this.generateSlug(createTopicDto.title);

    // Slug'un benzersiz olduğundan emin ol
    const existingTopic = await this.prisma.topic.findUnique({
      where: { slug },
    });

    if (existingTopic) {
      throw new ConflictException('Topic with this title already exists');
    }

    return this.prisma.topic.create({
      data: {
        title: createTopicDto.title,
        slug,
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });
  }

  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [topics, total] = await Promise.all([
      this.prisma.topic.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
            },
          },
          _count: {
            select: {
              entries: true,
            },
          },
        },
      }),
      this.prisma.topic.count(),
    ]);

    return {
      topics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(slug: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { slug },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return topic;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async remove(id: number) {
    const topic = await this.prisma.topic.findUnique({ where: { id } });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Delete all entries and their votes (cascade)
    await this.prisma.topic.delete({ where: { id } });

    return { message: 'Topic deleted successfully' };
  }

  async search(query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const topics = await this.prisma.topic.findMany({
      where: {
        title: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: 10,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        _count: {
          select: {
            entries: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return topics;
  }
}
