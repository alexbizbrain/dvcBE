import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AdminAuthServiceCommon {
  constructor(private readonly prismaService: PrismaService) {}

  async validateAdminById(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isActive: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!user) return null;
    const isAdmin = (user.role?.name ?? '').toUpperCase() === 'ADMIN';
    if (!isAdmin || !user.isActive) return null;
    return {
      id: user.id,
      role: 'admin' as const,
    };
  }
}
