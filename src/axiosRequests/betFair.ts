import axios from 'config/axios';
import variables from 'config/variables';
import {
  loginBetfairMethod,
  getSportsMethod,
  getEventsMethod,
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
