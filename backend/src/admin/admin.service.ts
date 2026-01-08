import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // User Management
  async getAllUsers(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              topics: true,
              entries: true,
              votes: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            topics: true,
            entries: true,
            votes: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserRole(id: number, role: 'USER' | 'MODERATOR' | 'ADMIN') {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });
  }

  async deleteUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete user's votes first (due to foreign key constraints)
    await this.prisma.vote.deleteMany({ where: { userId: id } });

    // Soft delete user's entries
    await this.prisma.entry.updateMany({
      where: { userId: id },
      data: { isDeleted: true },
    });

    // Delete user's topics (entries will be cascade deleted)
    await this.prisma.topic.deleteMany({ where: { createdBy: id } });

    // Finally delete the user
    await this.prisma.user.delete({ where: { id } });

    return { message: 'User deleted successfully' };
  }

  // Topic Management
  async moveTopic(id: number, newTitle: string) {
    const topic = await this.prisma.topic.findUnique({ where: { id } });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Generate new slug from title
    const slug = newTitle
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return this.prisma.topic.update({
      where: { id },
      data: {
        title: newTitle,
        slug,
      },
    });
  }

  async mergeTopics(sourceId: number, targetId: number) {
    const [sourceTopic, targetTopic] = await Promise.all([
      this.prisma.topic.findUnique({ where: { id: sourceId } }),
      this.prisma.topic.findUnique({ where: { id: targetId } }),
    ]);

    if (!sourceTopic) {
      throw new NotFoundException('Source topic not found');
    }

    if (!targetTopic) {
      throw new NotFoundException('Target topic not found');
    }

    if (sourceId === targetId) {
      throw new ForbiddenException('Cannot merge a topic with itself');
    }

    // Move all entries from source to target
    await this.prisma.entry.updateMany({
      where: { topicId: sourceId },
      data: { topicId: targetId },
    });

    // Delete the source topic
    await this.prisma.topic.delete({ where: { id: sourceId } });

    return {
      message: 'Topics merged successfully',
      sourceTitle: sourceTopic.title,
      targetTitle: targetTopic.title,
      targetId: targetId,
    };
  }

  async deleteTopic(id: number) {
    const topic = await this.prisma.topic.findUnique({ where: { id } });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Delete all entries and their votes (cascade)
    await this.prisma.topic.delete({ where: { id } });

    return { message: 'Topic deleted successfully' };
  }

  // Entry Management
  async moveEntry(id: number, newTopicId: number) {
    const [entry, newTopic] = await Promise.all([
      this.prisma.entry.findUnique({ where: { id } }),
      this.prisma.topic.findUnique({ where: { id: newTopicId } }),
    ]);

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    if (!newTopic) {
      throw new NotFoundException('Target topic not found');
    }

    return this.prisma.entry.update({
      where: { id },
      data: { topicId: newTopicId },
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
  }

  async forceDeleteEntry(id: number) {
    const entry = await this.prisma.entry.findUnique({ where: { id } });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    // Delete votes first (cascade should handle this, but being explicit)
    await this.prisma.vote.deleteMany({ where: { entryId: id } });

    // Hard delete the entry
    await this.prisma.entry.delete({ where: { id } });

    return { message: 'Entry deleted permanently' };
  }

  // Statistics
  async getStatistics() {
    const [
      totalUsers,
      totalTopics,
      totalEntries,
      totalVotes,
      recentUsers,
      recentTopics,
      recentEntries,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.topic.count(),
      this.prisma.entry.count({ where: { isDeleted: false } }),
      this.prisma.vote.count(),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      this.prisma.topic.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.entry.count({
        where: {
          isDeleted: false,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total: {
        users: totalUsers,
        topics: totalTopics,
        entries: totalEntries,
        votes: totalVotes,
      },
      recent: {
        users: recentUsers,
        topics: recentTopics,
        entries: recentEntries,
      },
    };
  }

  // Activity Log (simplified - could be expanded with a dedicated activity log table)
  async getActivityLog(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    // Get recent entries as activity
    const recentEntries = await this.prisma.entry.findMany({
      where: { isDeleted: false },
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
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
          },
        },
      },
    });

    return {
      activities: recentEntries.map((entry) => ({
        id: entry.id,
        type: 'entry_created',
        user: entry.user,
        topic: entry.topic,
        content: entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : ''),
        createdAt: entry.createdAt,
      })),
      pagination: {
        page,
        limit,
      },
    };
  }

  // Permission Management
  async getModeratorPermissions(userId: number) {
    const permissions = await this.prisma.moderatorPermission.findUnique({
      where: { userId },
    });
    
    if (!permissions) {
      return {
        canDeleteEntry: false,
        canDeleteTopic: false,
        canBanUser: false,
        canEditEntry: false,
        canMoveEntry: false,
        canMergeTopic: false,
      };
    }
    
    return permissions;
  }

  async updateModeratorPermissions(
    userId: number,
    permissions: {
      canDeleteEntry?: boolean;
      canDeleteTopic?: boolean;
      canBanUser?: boolean;
      canEditEntry?: boolean;
      canMoveEntry?: boolean;
      canMergeTopic?: boolean;
    }
  ) {
    return this.prisma.moderatorPermission.upsert({
      where: { userId },
      update: permissions,
      create: {
        userId,
        ...permissions,
      },
    });
  }

  // Ban Management
  async banUser(userId: number, reason: string, until?: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedUntil: until,
        banReason: reason,
      },
    });
  }

  async unbanUser(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        bannedUntil: null,
        banReason: null,
      },
    });
  }

  async getBannedUsers() {
    return this.prisma.user.findMany({
      where: {
        isBanned: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        isBanned: true,
        bannedUntil: true,
        banReason: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
