import { Module, Global } from '@nestjs/common';
import { databaseServices } from 'services/db.service';

@Global()
@Module({
  providers: databaseServices,
  exports: databaseServices,
})
export default class DatabaseModule {}
