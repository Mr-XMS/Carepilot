import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { ResolveIncidentDto } from './dto/resolve-incident.dto';
import { QueryIncidentsDto } from './dto/query-incidents.dto';
import { OrgId, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Incidents')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private incidentsService: IncidentsService) {}

  @Post()
  @ApiOperation({ summary: 'Report a new incident' })
  create(
    @OrgId() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateIncidentDto,
  ) {
    return this.incidentsService.create(orgId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List incidents with filters' })
  findAll(@OrgId() orgId: string, @Query() query: QueryIncidentsDto) {
    return this.incidentsService.findAll(orgId, query);
  }

  @Get('register-report')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get full incident register report (for audit)' })
  registerReport(
    @OrgId() orgId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.incidentsService.getRegisterReport(orgId, startDate, endDate);
  }

  @Get('overdue-reportables')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'List reportable incidents past the 5-business-day notification deadline',
  })
  overdueReportables(@OrgId() orgId: string) {
    return this.incidentsService.getOverdueReportables(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get incident details' })
  findOne(@OrgId() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.incidentsService.findOne(orgId, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update incident details' })
  update(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncidentDto,
  ) {
    return this.incidentsService.update(orgId, id, dto);
  }

  @Post(':id/start-investigation')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Move incident to investigation' })
  startInvestigation(@OrgId() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.incidentsService.startInvestigation(orgId, id);
  }

  @Post(':id/resolve')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Mark incident as resolved with outcome notes' })
  resolve(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveIncidentDto,
  ) {
    return this.incidentsService.resolve(orgId, id, dto);
  }

  @Post(':id/close')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Close a resolved incident' })
  close(@OrgId() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.incidentsService.close(orgId, id);
  }
}
