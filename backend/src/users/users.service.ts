import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            topics: true,
            entries: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isBanned: true,
        bannedUntil: true,
        banReason: true,
        createdAt: true,
        _count: {
          select: {
            topics: true,
            entries: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getUserEntries(username: string, page: number = 1, limit: number = 20) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      this.prisma.entry.findMany({
        where: {
          userId: user.id,
          isDeleted: false,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
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
      this.prisma.entry.count({
        where: {
          userId: user.id,
          isDeleted: false,
        },
      }),
    ]);

    // Calculate vote counts for each entry
    const entriesWithVotes = await Promise.all(
      entries.map(async (entry) => {
        const voteSum = await this.prisma.vote.aggregate({
          where: { entryId: entry.id },
          _sum: { value: true },
        });
        return {
          ...entry,
          voteCount: voteSum._sum.value || 0,
        };
      })
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

  async getTopEntries(username: string, limit: number = 10) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const entries = await this.prisma.entry.findMany({
      where: {
        userId: user.id,
        isDeleted: false,
      },
      include: {
        topic: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    // Calculate vote counts and sort
    const entriesWithVotes = await Promise.all(
      entries.map(async (entry) => {
        const voteSum = await this.prisma.vote.aggregate({
          where: { entryId: entry.id },
          _sum: { value: true },
        });
        return {
          ...entry,
          voteCount: voteSum._sum.value || 0,
        };
      })
    );

    // Sort by vote count and return top entries
    return entriesWithVotes
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, limit);
  }

  async updateProfile(userId: number, updateData: { email?: string; password?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data: any = {};

    if (updateData.email) {
      // Check if email is already taken
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: updateData.email,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }

      data.email = updateData.email;
    }

    if (updateData.password) {
      if (updateData.password.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters');
      }
      data.passwordHash = await bcrypt.hash(updateData.password, 10);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });
  }
}
