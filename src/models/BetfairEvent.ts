import {
  Table,
  Column,
  Model,
  IsUUID,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { UUIDV4 } from 'sequelize';

import BetfairSport from './BetfairSport';
import BetfairMarket from './BetfairMarket';
@Table
export default class BetfairEvent extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(UUIDV4)
  @Column
  id: string;

  @Column({
    unique: true,
  })
  eventId: string;

  @Column
  name: string;

  @ForeignKey(() => BetfairSport)
  @Column
  sportId: string;

  @BelongsTo(() => BetfairSport)
  sport: BetfairSport;

  @HasMany(() => BetfairMarket)
  markets: BetfairMarket[];
}
