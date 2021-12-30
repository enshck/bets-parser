import { Injectable, Inject } from '@nestjs/common';

import { dbTables } from 'const/dbTables';
import BetfairSport from 'models/BetfairSport';
import BetfairEvent from 'models/BetfairEvent';
import BetfairMarket from 'models/BetfairMarket';
import BetfairRunner from 'models/BetfairRunner';

interface IGetBetfairDataQuery {
  limit: number;
  offset: number;
}

@Injectable()
class BetfairDataService {
  constructor(
    @Inject(dbTables.SPORT_TABLE)
    private sportsTable: typeof BetfairSport,
  ) {}
  async getBetfairData(query: IGetBetfairDataQuery): Promise<any> {
    const { limit = 1, offset = 0 } = query;

    const result = await this.sportsTable.findAll({
      attributes: ['id', 'eventId', 'name'],
      limit,
      offset,
      include: [
        {
          association: 'events',
          attributes: ['id', 'eventId', 'name'],
          include: [
            {
              association: 'markets',
              attributes: ['id', 'marketId', 'name'],
              include: [
                {
                  association: 'runners',
                  attributes: [
                    'id',
                    'price',
                    'size',
                    'isAvailableToBack',
                    'order',
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const data = result.map((sport) => {
      const sportData: BetfairSport = sport.get();

      return {
        ...sportData,
        events: sportData.events.map((event) => {
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
                    [isAvailableToBack ? 'avaliableToBack' : 'avaliableToLay']:
                      {
                        price,
                        size,
                      },
                  };
                } else {
                  sortedRanners[order] = {
                    [isAvailableToBack ? 'avaliableToBack' : 'avaliableToLay']:
                      {
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
        }),
      };
    });

    return data;
  }
}

export default BetfairDataService;
