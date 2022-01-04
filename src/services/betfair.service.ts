import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Op } from 'sequelize';

import { dbTables } from 'const/dbTables';
import BetfairSport from 'models/BetfairSport';
import BetfairEvent from 'models/BetfairEvent';
import BetfairMarket from 'models/BetfairMarket';
import BetfairRunner from 'models/BetfairRunner';

interface IGetBetfairDataQuery {
  limit: number;
  offset: number;
}

interface IGetEventsDataQuery {
  search: string;
}

const commonEventParametrs = {
  attributes: ['id', 'eventId', 'name'],
  include: [
    {
      association: 'markets',
      attributes: ['id', 'marketId', 'name'],
      include: [
        {
          association: 'runners',
          attributes: ['id', 'price', 'size', 'isAvailableToBack', 'order'],
        },
      ],
    },
  ],
};

@Injectable()
class BetfairDataService {
  constructor(
    @Inject(dbTables.SPORT_TABLE)
    private sportsTable: typeof BetfairSport,
    @Inject(dbTables.BETFAIR_EVENT_TABLE)
    private eventTable: typeof BetfairEvent,
  ) {}

  private async parseEventsData(events: BetfairEvent[]) {
    const parsedData = events.map((event) => {
      const eventData: BetfairEvent = event.get();

      return {
        ...eventData,
        markets: eventData.markets.map((market) => {
          const marketData: BetfairMarket = market.get();

          const sortedRanners = {};

          const runnersData: BetfairRunner[] = marketData.runners.map(
            (runner) => runner.get(),
          );

          runnersData.forEach((elem) => {
            const { isAvailableToBack, order, price, size } = elem;
            const existingElement = sortedRanners[order];

            if (existingElement) {
              sortedRanners[order] = {
                ...existingElement,
                [isAvailableToBack ? 'avaliableToBack' : 'avaliableToLay']: {
                  price,
                  size,
                },
              };
            } else {
              sortedRanners[order] = {
                [isAvailableToBack ? 'avaliableToBack' : 'avaliableToLay']: {
                  price,
                  size,
                },
              };
            }
          });

          return {
            ...marketData,
            runners: Object.values(sortedRanners),
          };
        }),
      };
    });

    return parsedData;
  }

  async getBetfairData(query: IGetBetfairDataQuery): Promise<any> {
    const { limit = 1, offset = 0 } = query;

    const result = await this.sportsTable.findAll({
      attributes: ['id', 'eventId', 'name'],
      limit,
      offset,
      include: [
        {
          association: 'events',
          ...commonEventParametrs,
        },
      ],
    });

    const data = result.map((sport) => {
      const sportData: BetfairSport = sport.get();

      return {
        ...sportData,
        events: this.parseEventsData(sportData.events),
      };
    });

    return data;
  }

  async getEvents(query: IGetEventsDataQuery): Promise<any> {
    const { search } = query;

    if (!search) {
      throw new BadRequestException('Search is required');
    }

    const result = await this.eventTable.findAll({
      where: {
        name: {
          [Op.like]: `%${search}%`,
        },
      },
      ...commonEventParametrs,
    });

    return this.parseEventsData(result);
  }
}

export default BetfairDataService;
