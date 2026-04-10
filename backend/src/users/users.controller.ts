import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { OrgId } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List users in the current organisation',
    description:
      'Returns users scoped to the authenticated users organisation. Filter by role, search by name/email, include inactive with activeOnly=false.',
  })
  findAll(@OrgId() orgId: string, @Query() query: QueryUsersDto) {
    return this.usersService.findAll(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user by ID' })
  findOne(@OrgId() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(orgId, id);
  }
}
