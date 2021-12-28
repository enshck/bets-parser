import { config } from 'dotenv';

config();

export default {
  port: process.env.PORT,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,
  dbPort: process.env.DB_PORT,
  redisUrl: process.env.REDIS_URL,
  redisPort: process.env.REDIS_PORT,
  redisPassword: process.env.REDIS_PASSWORD,
  redisUser: process.env.REDIS_USER,
  betfairLogin: process.env.BETFAIR_LOGIN,
  betfairPassword: process.env.BETFAIR_PASSWORD,
  betfairApiKey: process.env.BETFAIR_API_KEY,
};
