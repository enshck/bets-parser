import {
  Table,
  Column,
  Model,
  IsUUID,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  DataType,
} from 'sequelize-typescript';
import { UUIDV4 } from 'sequelize';

import BetfairMarket from './BetfairMarket';

@Table({
  paranoid: true,
})
export default class BetfairRunner extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(UUIDV4)
  @Column
  id: string;

  @Column({
    type: DataType.FLOAT,
  })
  price: number;

  @Column({
    type: DataType.FLOAT,
  })
  size: number;

  @Column
  isAvailableToBack: boolean;

  @Column
  order: number;

  @ForeignKey(() => BetfairMarket)
  @Column
  marketId: string;

  @BelongsTo(() => BetfairMarket)
  market: BetfairMarket;
}
