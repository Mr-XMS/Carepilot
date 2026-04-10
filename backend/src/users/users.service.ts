import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { QueryUsersDto } from './dto/query-users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organisationId: string, query: QueryUsersDto) {
    const activeOnly = query.activeOnly !== 'false';

    const where: Prisma.UserWhereInput = {
      organisationId,
      deletedAt: null,
      ...(activeOnly && { isActive: true }),
      ...(query.role && { role: query.role }),
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        employmentType: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
  }

  async findOne(organisationId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organisationId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        employmentType: true,
        hourlyRate: true,
        qualifications: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
