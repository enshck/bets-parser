import { Module } from '@nestjs/common';

import DatabaseModule from './modules/db.module';
import BullModule from 'modules/bull.module';
import BetfairModule from 'modules/betfair.module';

@Module({
  imports: [DatabaseModule, BullModule, BetfairModule],
})
export class AppModule {}
