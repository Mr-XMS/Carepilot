import { Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

interface LogParams {
  organisationId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  changes?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(params: LogParams) {
    return this.prisma.auditLog.create({
      data: {
        organisationId: params.organisationId,
        userId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        changes: params.changes ?? undefined,
        ipAddress: params.ipAddress,
      },
    });
  }
}
