import {
  Table,
  Column,
  Model,
  IsUUID,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { UUIDV4 } from 'sequelize';

import BetfairEvent from './BetfairEvent';

@Table
export default class BetfairMarket extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(UUIDV4)
  @Column
  id: string;

  @Column({
    unique: true,
  })
  marketId: string;

  @Column
  name: string;

  @ForeignKey(() => BetfairEvent)
  @Column
  eventId: string;

  @BelongsTo(() => BetfairEvent)
  event: BetfairEvent;
}
