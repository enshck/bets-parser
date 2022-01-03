import { Injectable, Inject } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue, Processor, Process } from '@nestjs/bull';
import { Op } from 'sequelize';

import { dbTables } from 'const/dbTables';
import Sport from 'models/BetfairSport';
import BetfairEvent from 'models/BetfairEvent';
import BetfairMarket from 'models/BetfairMarket';
import BetfairRunner from 'models/BetfairRunner';
import { queueTypes } from 'const/queueBull';
import {
  login,
  getSports,
  getEvents as getEventsByType,
  getMarkets as getMarketsByType,
  getRunnersByMarkets,
} from 'axiosRequests/betFair';
import async from 'async';
import { ISport } from 'interfaces/betfair/sports';
import { IEventData } from 'interfaces/betfair/events';
import { IMarket } from 'interfaces/betfair/markets';
import { IMarketWithRunners } from 'interfaces/betfair/runners';

@Injectable()
export class BullService {
  constructor(
    @InjectQueue(queueTypes.UPDATE_BETS_DATA)
    private updateBetsDataQueue: Queue,
    @Inject(dbTables.SPORT_TABLE)
    private sportTable: typeof Sport,
    @Inject(dbTables.BETFAIR_EVENT_TABLE)
    private eventTable: typeof BetfairEvent,
    @Inject(dbTables.BETFAIR_MARKET_TABLE)
    private marketTable: typeof BetfairMarket,
    @Inject(dbTables.BETFAIR_RUNNER_TABLE)
    private runnerTable: typeof BetfairRunner,
  ) {}

  async onApplicationBootstrap() {
    const initRepeatableJob = async () => {
      await this.updateBetsDataQueue.empty();
      await this.updateBetsDataQueue.add(
        {},
        {
          repeat: {
            // every 20 seconds
            every: 20000,
          },
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
    };

    await this.updateData();
    await initRepeatableJob();
  }

  async updateData() {
    const result = await login();

    const token = result?.data?.token;
    console.log('Betfair token recieved !!!');

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
        .reduce((accum, elem) => [...accum, ...elem], [])
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

    const getCoeffs = async () => {
      let slicedMarketIds: number[][] = [];
      const marketsData = (await this.marketTable.findAll()).map((elem) =>
        elem.get(),
      );

      const marketIds = marketsData.map((elem) => elem.marketId);

      const sliceMarketIds = () => {
        slicedMarketIds = [...slicedMarketIds, marketIds.splice(0, 100)];

        if (marketIds.length > 0) {
          sliceMarketIds();
        }
      };

      sliceMarketIds();

      const promises = slicedMarketIds.map((ids) =>
        getRunnersByMarkets(token, ids),
      );

      const externalMarketIdToInternal = {};

      marketsData.forEach((elem) => {
        const extenalMarketId = elem?.marketId;
        const internalMarketId = elem?.id;

        externalMarketIdToInternal[extenalMarketId] = internalMarketId;
      });

      const results: IMarketWithRunners[] = (await Promise.all(promises))
        .map((elem) => elem.data)
        .reduce((acc, elem) => [...acc, ...elem], []);

      const runnersData = [];

      results.forEach((elem) => {
        const { marketId: externalMarketId, runners } = elem;
        const marketId = externalMarketIdToInternal[externalMarketId];

        runners.forEach((elem, key) => {
          const [availableToBack] = elem?.ex?.availableToBack;
          const [availableToLay] = elem?.ex?.availableToLay;

          if (availableToBack) {
            runnersData.push({
              ...availableToBack,
              isAvailableToBack: true,
              order: key,
              marketId,
            });
          }

          if (availableToLay) {
            runnersData.push({
              ...availableToLay,
              isAvailableToBack: false,
              order: key,
              marketId,
            });
          }
        });
      });

      await this.runnerTable.destroy({
        where: {},
        truncate: true,
      });
      await this.runnerTable.bulkCreate(runnersData);

      await this.runnerTable.destroy({
        where: {
          deletedAt: {
            [Op.ne]: null,
          },
        },
        force: true,
      });
    };

    // getting data from bestfair ~ 100 parallel requests every 20 seconds -- hard process
    async.parallel([getSportsData, getEvents, getMarkets, getCoeffs]);
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
