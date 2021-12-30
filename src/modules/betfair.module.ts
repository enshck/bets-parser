import { Module } from '@nestjs/common';

import BetfairDataService from 'services/betfair.service';
import BetfairController from 'controllers/betfair.controller';

@Module({
  controllers: [BetfairController],
  providers: [BetfairDataService],
  exports: [],
})
export default class BetfairModule {}
