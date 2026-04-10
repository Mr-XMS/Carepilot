import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { UsersModule } from './users/users.module';
import { ParticipantsModule } from './participants/participants.module';
import { NdisPlansModule } from './ndis-plans/ndis-plans.module';
import { NdisCatalogueModule } from './ndis-catalogue/ndis-catalogue.module';
import { ServiceAgreementsModule } from './service-agreements/service-agreements.module';
import { ShiftsModule } from './shifts/shifts.module';
import { ShiftNotesModule } from './shift-notes/shift-notes.module';
import { InvoicesModule } from './invoices/invoices.module';
import { SchadsModule } from './schads/schads.module';
import { IncidentsModule } from './incidents/incidents.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10000, limit: 20 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
    PrismaModule,HealthModule,
    AuthModule,
    OrganisationsModule,
    UsersModule,
    ParticipantsModule,
    NdisPlansModule,
    NdisCatalogueModule,
    ServiceAgreementsModule,
    ShiftsModule,
    ShiftNotesModule,
    InvoicesModule,
    SchadsModule,
    IncidentsModule,
    AuditLogModule,
  ],
})
export class AppModule {}
