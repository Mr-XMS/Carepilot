import { Module } from '@nestjs/common';
import { SchadsService } from './schads.service';
import { SchadsController } from './schads.controller';
import { SchadsRuleEngine } from './schads-rule-engine';

@Module({
  controllers: [SchadsController],
  providers: [SchadsService, SchadsRuleEngine],
  exports: [SchadsService, SchadsRuleEngine],
})
export class SchadsModule {}
