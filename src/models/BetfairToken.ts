import {
  Table,
  Column,
  Model,
  IsUUID,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';
import { UUIDV4 } from 'sequelize';

@Table
export default class BetfairToken extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(UUIDV4)
  @Column
  id: string;

  @Column
  token: string;
}
