import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  Prisma,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
} from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { ResolveIncidentDto } from './dto/resolve-incident.dto';
import { QueryIncidentsDto } from './dto/query-incidents.dto';

const REPORTABLE_CATEGORIES = new Set<IncidentCategory>([
  IncidentCategory.ABUSE,
  IncidentCategory.NEGLECT,
  IncidentCategory.DEATH,
  IncidentCategory.RESTRICTIVE_PRACTICE,
]);

const OPEN_STATUSES: IncidentStatus[] = [
  IncidentStatus.OPEN,
  IncidentStatus.INVESTIGATING,
];

const REPORTABLE_DEADLINE_BUSINESS_DAYS = 5;

@Injectable()
export class IncidentsService {
  constructor(private prisma: PrismaService) {}

  async create(organisationId: string, reportedByUserId: string, dto: CreateIncidentDto) {
    if (dto.participantId) {
      const participant = await this.prisma.participant.findFirst({
        where: { id: dto.participantId, organisationId, deletedAt: null },
      });
      if (!participant) {
        throw new NotFoundException('Participant not found');
      }
    }

    const isReportable = this.deriveReportableFlag(dto.category, dto.severity);

    return this.prisma.incident.create({
      data: {
        organisationId,
        participantId: dto.participantId,
        reportedByUserId,
        incidentDate: new Date(dto.incidentDate),
        category: dto.category,
        severity: dto.severity,
        isReportable,
        description: dto.description,
        immediateActions: dto.immediateActions,
        status: IncidentStatus.OPEN,
      },
      include: {
        participant: { select: { firstName: true, lastName: true, ndisNumber: true } },
        reportedBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async findAll(organisationId: string, query: QueryIncidentsDto) {
    const {
      participantId,
      status,
      category,
      severity,
      isReportable,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = query;

    const where: Prisma.IncidentWhereInput = {
      organisationId,
      ...(participantId && { participantId }),
      ...(status && { status }),
      ...(category && { category }),
      ...(severity && { severity }),
      ...(isReportable !== undefined && { isReportable }),
      ...(startDate && endDate && {
        incidentDate: { gte: new Date(startDate), lte: new Date(endDate) },
      }),
    };

    const [incidents, total, openCount, reportableOpenCount] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        include: {
          participant: { select: { id: true, firstName: true, lastName: true, ndisNumber: true } },
          reportedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { incidentDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.incident.count({ where }),
      this.prisma.incident.count({
        where: { organisationId, status: { in: OPEN_STATUSES } },
      }),
      this.prisma.incident.count({
        where: {
          organisationId,
          isReportable: true,
          status: { in: OPEN_STATUSES },
        },
      }),
    ]);

    const decorated = incidents.map((incident) => ({
      ...incident,
      reportingDeadline: incident.isReportable
        ? this.calculateReportingDeadline(incident.incidentDate)
        : null,
      isOverdue:
        incident.isReportable &&
        OPEN_STATUSES.includes(incident.status) &&
        new Date() > this.calculateReportingDeadline(incident.incidentDate),
    }));

    return {
      data: decorated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        openCount,
        reportableOpenCount,
      },
    };
  }

  async findOne(organisationId: string, id: string) {
    const incident = await this.prisma.incident.findFirst({
      where: { id, organisationId },
      include: {
        participant: true,
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    return {
      ...incident,
      reportingDeadline: incident.isReportable
        ? this.calculateReportingDeadline(incident.incidentDate)
        : null,
    };
  }

  async update(organisationId: string, id: string, dto: UpdateIncidentDto) {
    const existing = await this.findOne(organisationId, id);

    if (existing.status === IncidentStatus.CLOSED) {
      throw new BadRequestException('Cannot modify a closed incident');
    }

    const updateData: Prisma.IncidentUpdateInput = {};

    if (dto.category) updateData.category = dto.category;
    if (dto.severity) updateData.severity = dto.severity;
    if (dto.description) updateData.description = dto.description;
    if (dto.immediateActions !== undefined) updateData.immediateActions = dto.immediateActions;

    if (dto.category || dto.severity) {
      updateData.isReportable = this.deriveReportableFlag(
        dto.category || existing.category,
        dto.severity || existing.severity,
      );
    }

    return this.prisma.incident.update({
      where: { id },
      data: updateData,
    });
  }

  async startInvestigation(organisationId: string, id: string) {
    const incident = await this.findOne(organisationId, id);

    if (incident.status !== IncidentStatus.OPEN) {
      throw new BadRequestException('Only open incidents can move to investigation');
    }

    return this.prisma.incident.update({
      where: { id },
      data: { status: IncidentStatus.INVESTIGATING },
    });
  }

  async resolve(organisationId: string, id: string, dto: ResolveIncidentDto) {
    const incident = await this.findOne(organisationId, id);

    if (incident.status === IncidentStatus.CLOSED) {
      throw new BadRequestException('Incident is already closed');
    }

    return this.prisma.incident.update({
      where: { id },
      data: {
        status: IncidentStatus.RESOLVED,
        outcomeNotes: dto.outcomeNotes,
        resolvedAt: new Date(),
      },
    });
  }

  async close(organisationId: string, id: string) {
    const incident = await this.findOne(organisationId, id);

    if (incident.status !== IncidentStatus.RESOLVED) {
      throw new BadRequestException('Only resolved incidents can be closed');
    }

    return this.prisma.incident.update({
      where: { id },
      data: { status: IncidentStatus.CLOSED },
    });
  }

  async getRegisterReport(organisationId: string, startDate?: string, endDate?: string) {
    const where: Prisma.IncidentWhereInput = {
      organisationId,
      ...(startDate && endDate && {
        incidentDate: { gte: new Date(startDate), lte: new Date(endDate) },
      }),
    };

    const incidents = await this.prisma.incident.findMany({
      where,
      include: {
        participant: { select: { firstName: true, lastName: true, ndisNumber: true } },
        reportedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { incidentDate: 'desc' },
    });

    const summary = {
      total: incidents.length,
      byCategory: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      reportableCount: incidents.filter((i) => i.isReportable).length,
      overdueReportables: incidents.filter(
        (i) =>
          i.isReportable &&
          OPEN_STATUSES.includes(i.status) &&
          new Date() > this.calculateReportingDeadline(i.incidentDate),
      ).length,
    };

    for (const inc of incidents) {
      summary.byCategory[inc.category] = (summary.byCategory[inc.category] || 0) + 1;
      summary.bySeverity[inc.severity] = (summary.bySeverity[inc.severity] || 0) + 1;
      summary.byStatus[inc.status] = (summary.byStatus[inc.status] || 0) + 1;
    }

    return {
      summary,
      incidents: incidents.map((i) => ({
        ...i,
        reportingDeadline: i.isReportable ? this.calculateReportingDeadline(i.incidentDate) : null,
      })),
    };
  }

  async getOverdueReportables(organisationId: string) {
    const reportables = await this.prisma.incident.findMany({
      where: {
        organisationId,
        isReportable: true,
        status: { in: OPEN_STATUSES },
      },
      include: {
        participant: { select: { firstName: true, lastName: true, ndisNumber: true } },
        reportedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { incidentDate: 'asc' },
    });

    const now = new Date();
    return reportables
      .map((i) => ({
        ...i,
        reportingDeadline: this.calculateReportingDeadline(i.incidentDate),
        hoursOverdue: Math.max(
          0,
          (now.getTime() - this.calculateReportingDeadline(i.incidentDate).getTime()) / 3600000,
        ),
      }))
      .filter((i) => i.hoursOverdue > 0);
  }

  private deriveReportableFlag(
    category: IncidentCategory,
    severity: IncidentSeverity,
  ): boolean {
    if (REPORTABLE_CATEGORIES.has(category)) return true;
    if (severity === IncidentSeverity.CRITICAL) return true;
    return false;
  }

  private calculateReportingDeadline(incidentDate: Date): Date {
    const deadline = new Date(incidentDate);
    let businessDaysAdded = 0;

    while (businessDaysAdded < REPORTABLE_DEADLINE_BUSINESS_DAYS) {
      deadline.setDate(deadline.getDate() + 1);
      const day = deadline.getDay();
      if (day !== 0 && day !== 6) {
        businessDaysAdded++;
      }
    }

    deadline.setHours(23, 59, 59, 999);
    return deadline;
  }
}
