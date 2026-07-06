
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: any) {
    // Fix: Access 'user' with type assertion to resolve Prisma member resolution issues
    return (this.prisma as any).user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      }
    });
  }

  async findByEmail(email: string) {
    // Fix: Access 'user' with type assertion to resolve Prisma member resolution issues
    return (this.prisma as any).user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return (this.prisma as any).user.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    return (this.prisma as any).user.update({
      where: { id },
      data
    });
  }
}
