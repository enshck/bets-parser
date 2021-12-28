import {
  Table,
  Column,
  Model,
  IsUUID,
  PrimaryKey,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { UUIDV4 } from 'sequelize';

import BetFairEvent from './BetfairEvent';

@Table
export default class BetfairSport extends Model {
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

  @HasMany(() => BetFairEvent)
  events: BetFairEvent[];
}
