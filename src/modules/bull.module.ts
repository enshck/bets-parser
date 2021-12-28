import { Module } from '@nestjs/common';
import { BullModule as Bull } from '@nestjs/bull';

import variables from 'config/variables';
import {
  BullService,
  UpdateTokenConsumer,
  UpdateBetsDataConsumer,
} from 'services/bull.service';
import { queueTypes } from 'const/queueBull';

@Module({
  imports: [
    Bull.forRoot({
      redis: {
        host: variables.redisUrl,
        port: +variables.redisPort,
      },
    }),
    Bull.registerQueue({
      name: queueTypes.UPDATE_BETFAIR_TOKEN,
    }),
    Bull.registerQueue({
      name: queueTypes.UPDATE_BETS_DATA,
    }),
  ],
  providers: [BullService, UpdateTokenConsumer, UpdateBetsDataConsumer],
  exports: [BullService],
})
export default class BullModule {}
