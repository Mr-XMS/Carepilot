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
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { CreateRecurringShiftDto } from './dto/create-recurring-shift.dto';
import { CancelShiftDto } from './dto/cancel-shift.dto';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { QueryShiftsDto } from './dto/query-shifts.dto';
import { QueryExceptionsDto } from './dto/query-exceptions.dto';
import { OrgId, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Shifts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private shiftsService: ShiftsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Create a new shift' })
  create(@OrgId() orgId: string, @Body() dto: CreateShiftDto) {
    return this.shiftsService.create(orgId, dto);
  }

  @Post('recurring')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Create a recurring shift series' })
  createRecurring(@OrgId() orgId: string, @Body() dto: CreateRecurringShiftDto) {
    return this.shiftsService.createRecurring(orgId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List shifts with filters and pagination' })
  findAll(@OrgId() orgId: string, @Query() query: QueryShiftsDto) {
    return this.shiftsService.findAll(orgId, query);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get shifts for calendar view (date range)' })
  findCalendar(
    @OrgId() orgId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('userId') userId?: string,
  ) {
    return this.shiftsService.findCalendarView(orgId, startDate, endDate, userId);
  }

  @Get('exceptions')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'List cancelled and no-show shifts' })
  findExceptions(@OrgId() orgId: string, @Query() query: QueryExceptionsDto) {
    return this.shiftsService.findExceptions(orgId, query);
  }

  @Get('my-shifts')
  @ApiOperation({ summary: 'Get shifts assigned to the current user (support worker view)' })
  findMyShifts(
    @OrgId() orgId: string,
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.shiftsService.findCalendarView(orgId, startDate, endDate, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shift details with notes and history' })
  findOne(@OrgId() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.shiftsService.findOne(orgId, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update shift details' })
  update(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShiftDto,
  ) {
    return this.shiftsService.update(orgId, id, dto);
  }

  @Post(':id/cancel')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Cancel a shift with reason' })
  cancel(
    @OrgId() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelShiftDto,
  ) {
    return this.shiftsService.cancel(orgId, id, userId, dto);
  }

  @Post('recurring/:patternId/cancel')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Cancel all future shifts in a recurring series' })
  cancelRecurring(
    @OrgId() orgId: string,
    @Param('patternId', ParseUUIDPipe) patternId: string,
  ) {
    return this.shiftsService.cancelRecurringSeries(orgId, patternId);
  }

  @Post(':id/clock-in')
  @ApiOperation({ summary: 'Clock in to a shift (support worker)' })
  clockIn(
    @OrgId() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ClockInDto,
  ) {
    return this.shiftsService.clockIn(orgId, id, userId, dto);
  }

  @Post(':id/clock-out')
  @ApiOperation({ summary: 'Clock out of a shift (support worker)' })
  clockOut(
    @OrgId() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ClockOutDto,
  ) {
    return this.shiftsService.clockOut(orgId, id, userId, dto);
  }

  @Post(':id/no-show')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Mark a shift as no-show' })
  markNoShow(
    @OrgId() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.shiftsService.markNoShow(orgId, id, userId);
  }
}
