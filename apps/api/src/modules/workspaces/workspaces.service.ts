
import { Injectable, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: { name: string }, userId: string) {
    const slug = dto.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    // Check for slug collision
    // Fix: Access 'workspace' with type assertion to resolve Prisma member resolution issues
    const existing = await (this.prisma as any).workspace.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    // Fix: Access 'workspace' with type assertion to resolve Prisma member resolution issues
    return (this.prisma as any).workspace.create({
      data: {
        name: dto.name,
        slug: finalSlug,
        members: {
          create: {
            userId,
            role: 'admin',
          },
        },
      },
    });
  }

  async findByUser(userId: string) {
    // Fix: Access 'workspace' with type assertion to resolve Prisma member resolution issues
    return (this.prisma as any).workspace.findMany({
      where: {
        members: {
          some: { userId }
        }
      }
    });
  }

  async findByIdForUser(workspaceId: string, userId: string) {
    // Fix: Access 'member' with type assertion to resolve Prisma member resolution issues
    const member = await (this.prisma as any).member.findFirst({
      where: { userId, workspaceId }
    });

    if (!member) throw new ForbiddenException('Access denied to workspace');

    // Fix: Access 'workspace' with type assertion to resolve Prisma member resolution issues
    return (this.prisma as any).workspace.findUnique({ where: { id: workspaceId } });
  }

  async isMember(workspaceId: string, userId: string): Promise<boolean> {
    // Fix: Access 'member' with type assertion to resolve Prisma member resolution issues
    const count = await (this.prisma as any).member.count({
      where: { userId, workspaceId }
    });
    return count > 0;
  }

  async findMembers(workspaceId: string, userId: string) {
    await this.findByIdForUser(workspaceId, userId);
    return (this.prisma as any).member.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  async update(id: string, data: any) {
    return (this.prisma as any).workspace.update({
      where: { id },
      data
    });
  }
}
