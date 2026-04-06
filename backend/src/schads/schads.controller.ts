import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SchadsService } from './schads.service';
import { OrgId } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('SCHADS Compliance')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('schads')
export class SchadsController {
  constructor(private schadsService: SchadsService) {}

  @Get('validate')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Validate roster against SCHADS rules for a date range',
  })
  validate(
    @OrgId() orgId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('userId') userId?: string,
  ) {
    return this.schadsService.validateRosterByDateRange(orgId, startDate, endDate, userId);
  }

  @Get('validate-shift/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Validate a single shift against SCHADS rules' })
  validateShift(@OrgId() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.schadsService.validateSingleShift(orgId, id);
  }

  @Get('pay-estimate')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.COORDINATOR, UserRole.BILLING)
  @ApiOperation({
    summary: 'Estimate pay cost for an entire org roster in a date range',
  })
  estimateOrg(
    @OrgId() orgId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.schadsService.estimatePayForOrgRoster(orgId, startDate, endDate);
  }

  @Get('pay-estimate/:userId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.COORDINATOR, UserRole.BILLING)
  @ApiOperation({ summary: 'Estimate pay cost for a single worker' })
  estimateWorker(
    @OrgId() orgId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.schadsService.estimatePayForRoster(orgId, startDate, endDate, userId);
  }
}
