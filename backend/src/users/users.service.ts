import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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
        hourlyRate: true,
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

  async create(organisationId: string, dto: CreateUserDto) {
    // Check for duplicate email in same org
    const existing = await this.prisma.user.findFirst({
      where: { organisationId, email: dto.email.toLowerCase(), deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        organisationId,
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || UserRole.SUPPORT_WORKER,
        phone: dto.phone,
        employmentType: dto.employmentType,
        hourlyRate: dto.hourlyRate,
      },
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
        createdAt: true,
      },
    });
  }

  async update(organisationId: string, id: string, dto: UpdateUserDto) {
    await this.findOne(organisationId, id);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.employmentType !== undefined && { employmentType: dto.employmentType }),
        ...(dto.hourlyRate !== undefined && { hourlyRate: dto.hourlyRate }),
      },
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
        createdAt: true,
      },
    });
  }

  async deactivate(organisationId: string, id: string) {
    await this.findOne(organisationId, id);

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
