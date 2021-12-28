import { Sequelize } from 'sequelize-typescript';

import variables from 'config/variables';
import { dbTables } from 'const/dbTables';
import BetFairSport from 'models/BetfairSport';
import BetfairToken from 'models/BetfairToken';
import BetFairEvent from 'models/BetfairEvent';

export const databaseServices = [
  {
    provide: 'SEQUELIZE',
    useFactory: async () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        database: variables.dbName,
        username: variables.dbUser,
        password: variables.dbPassword,
      });
      sequelize.addModels([BetFairSport, BetfairToken, BetFairEvent]);
      await sequelize.sync();
      return sequelize;
    },
  },
  {
    provide: dbTables.SPORT_TABLE,
    useFactory: async () => {
      return BetFairSport;
    },
    inject: ['SEQUELIZE'],
  },
  {
    provide: dbTables.BETFAIR_TOKEN_TABLE,
    useFactory: async () => {
      return BetfairToken;
    },
    inject: ['SEQUELIZE'],
  },
  {
    provide: dbTables.BETFAIR_EVENT_TABLE,
    useFactory: async () => {
      return BetFairEvent;
    },
    inject: ['SEQUELIZE'],
  },
];
