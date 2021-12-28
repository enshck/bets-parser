import { Module } from '@nestjs/common';

import DatabaseModule from './modules/db.module';
import BullModule from 'modules/bull.module';

@Module({
  imports: [DatabaseModule, BullModule],
})
export class AppModule {}
