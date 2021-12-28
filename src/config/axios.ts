import axios from 'axios';

import variables from './variables';

const instance = axios.create({
  headers: { 'X-Application': variables.betfairApiKey },
});

export default instance;
