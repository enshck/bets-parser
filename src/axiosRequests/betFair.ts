import axios from 'config/axios';
import variables from 'config/variables';
import {
  loginBetfairMethod,
  getSportsMethod,
  getEventsMethod,
  getMarketsMethod,
  getRunnersMethod,
} from 'const/betfairMethods';

export const login = async () => {
  const params = new URLSearchParams();
  params.append('username', variables.betfairLogin);
  params.append('password', variables.betfairPassword);

  return await axios.post(loginBetfairMethod, params, {
    headers: {
      Accept: 'application/json',
    },
  });
};

export const getSports = async (token: string) =>
  await axios.post(
    getSportsMethod,
    {
      filter: {},
    },
    {
      headers: {
        'X-Authentication': token,
      },
    },
  );

export const getEvents = async (token: string, eventType: string) =>
  await axios.post(
    getEventsMethod,
    {
      filter: {
        eventTypeIds: [eventType],
      },
    },
    {
      headers: {
        'X-Authentication': token,
      },
    },
  );

export const getMarkets = async (token: string, eventType: string) =>
  await axios.post(
    getMarketsMethod,
    {
      filter: {
        eventTypeIds: [eventType],
      },
      maxResults: 1000,
      marketProjection: ['EVENT'],
    },
    {
      headers: {
        'X-Authentication': token,
      },
    },
  );

export const getRunnersByMarkets = async (token: string, marketsId: number[]) =>
  await axios.post(
    getRunnersMethod,
    {
      marketIds: marketsId,
      priceProjection: {
        priceData: ['EX_BEST_OFFERS'],
        exBestOffersOverrides: {
          bestPricesDepth: 2,
          rollupModel: 'STAKE',
          rollupLimit: 20,
        },
      },
      orderProjection: 'ALL',
      matchProjection: 'ROLLED_UP_BY_PRICE',
    },
    {
      headers: {
        'X-Authentication': token,
      },
    },
  );
