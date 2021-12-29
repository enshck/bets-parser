import { Injectable, Inject } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue, Processor, Process } from '@nestjs/bull';

import { dbTables } from 'const/dbTables';
import BetfairToken from 'models/BetfairToken';
import Sport from 'models/BetfairSport';
import BetfairEvent from 'models/BetfairEvent';
import BetfairMarket from 'models/BetfairMarket';
import { queueTypes } from 'const/queueBull';
import {
  login,
  getSports,
  getEvents as getEventsByType,
  getMarkets as getMarketsByType,
} from 'axiosRequests/betFair';
import async from 'async';
import { ISport } from 'interfaces/betfair/sports';
import { IEventData } from 'interfaces/betfair/events';
import { IMarket } from 'interfaces/betfair/markets';

@Injectable()
export class BullService {
  constructor(
    @InjectQueue(queueTypes.UPDATE_BETFAIR_TOKEN)
    private updateBetfairTokenQueue: Queue,
    @InjectQueue(queueTypes.UPDATE_BETS_DATA)
    private updateBetsDataQueue: Queue,
    @Inject(dbTables.BETFAIR_TOKEN_TABLE)
    private betFairTokenTable: typeof BetfairToken,
    @Inject(dbTables.SPORT_TABLE)
    private sportTable: typeof Sport,
    @Inject(dbTables.BETFAIR_EVENT_TABLE)
    private eventTable: typeof BetfairEvent,
    @Inject(dbTables.BETFAIR_MARKET_TABLE)
    private marketTable: typeof BetfairMarket,
  ) {}

  async onApplicationBootstrap() {
    const initRepeatableJob = async () => {
      await this.updateBetfairTokenQueue.empty();
      await this.updateBetfairTokenQueue.add(
        {},
        {
          repeat: {
            // every 2 hours HH * MM * SS * miliseconds
            every: 2 * 60 * 60 * 1000,
          },
        },
      );

      await this.updateBetsDataQueue.empty();
      await this.updateBetsDataQueue.add(
        {},
        {
          repeat: {
            // every 5 seconds
            every: 5000,
          },
        },
      );
    };

    await this.updateBetfairToken();
    await this.updateData();
    await initRepeatableJob();
  }

  async updateBetfairToken() {
    await this.betFairTokenTable.destroy({
      where: {},
      truncate: true,
    });

    const result = await login();

    const token = result?.data?.token;
    console.log('Betfair token recieved !!!');

    await this.betFairTokenTable.create({
      token,
    });
  }

  async updateData() {
    const result = await this.betFairTokenTable.findOne();
    const token = result.getDataValue('token');

    if (!token) {
      return;
    }

    const getSportsData = async () => {
      const sports = await getSports(token);
      const data: ISport[] = sports?.data ?? [];

      if (!data) {
        return;
      }

      const dataForDB = data.map((elem) => {
        const { id, name } = elem.eventType;

        return {
          eventId: id,
          name,
        };
      });

      await this.sportTable.bulkCreate(dataForDB, {
        updateOnDuplicate: ['eventId', 'name'],
      });
    };

    const getEvents = async () => {
      const sports = await this.sportTable.findAll();
      const eventTypeIds = sports.map((elem) => elem.getDataValue('eventId'));

      const sportsData = (await this.sportTable.findAll()).map((elem) =>
        elem.get(),
      );

      const promises = eventTypeIds.map((idOfType) =>
        getEventsByType(token, idOfType),
      );

      const results: IEventData[][] = (await Promise.all(promises)).map(
        (elem) => elem.data,
      );

      let dataForBD = [];

      results.forEach((events, key) => {
        const externalEventTypeId = eventTypeIds[key];
        const internalSportElement = sportsData.find(
          (elem) => elem.eventId === externalEventTypeId,
        );

        const eventsData = events.map((elem) => ({
          eventId: elem.event.id,
          name: elem.event.name,
          sportId: internalSportElement?.id,
        }));

        dataForBD = [...dataForBD, ...eventsData];
      });

      await this.eventTable.bulkCreate(dataForBD, {
        updateOnDuplicate: ['name', 'sportId'],
      });
    };

    const getMarkets = async () => {
      const sports = await this.sportTable.findAll();
      const events = (await this.eventTable.findAll()).map((elem) =>
        elem.get(),
      );
      const eventTypeIds = sports.map((elem) => elem.getDataValue('eventId'));
      const externalEventIdToInternal = {};

      events.forEach((elem) => {
        const extenalEventId = elem?.eventId;
        const internalEventId = elem?.id;

        externalEventIdToInternal[extenalEventId] = internalEventId;
      });

      const promises = eventTypeIds.map((idOfType) =>
        getMarketsByType(token, idOfType),
      );

      const results: IMarket[][] = (await Promise.all(promises)).map(
        (elem) => elem.data,
      );

      const dataForBD = results
        .reduce((accum, elem) => [...accum, ...elem])
        .map((elem) => {
          const { event, marketId, marketName } = elem;
          const internalEventId = externalEventIdToInternal[event.id];

          return {
            marketId,
            name: marketName,
            eventId: internalEventId,
          };
        });

      await this.marketTable.bulkCreate(dataForBD, {
        updateOnDuplicate: ['name', 'eventId'],
      });
    };

    async.parallel([getSportsData, getEvents, getMarkets]);
  }
}

@Processor(queueTypes.UPDATE_BETFAIR_TOKEN)
export class UpdateTokenConsumer {
  constructor(
    @Inject(BullService)
    private bullService: BullService,
  ) {}
  @Process()
  async updateToken() {
    await this.bullService.updateBetfairToken();
  }
}

@Processor(queueTypes.UPDATE_BETS_DATA)
export class UpdateBetsDataConsumer {
  constructor(
    @Inject(BullService)
    private bullService: BullService,
  ) {}
  @Process()
  async updateBetsData() {
    await this.bullService.updateData();
  }
}
