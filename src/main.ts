/* eslint-disable @typescript-eslint/no-var-requires */
import { NestFactory } from '@nestjs/core';
const cluster = require('cluster');
const os = require('os');
const process = require('process');

import variables from 'config/variables';
import { AppModule } from './app.module';

async function bootstrap() {
  const numCPUs = os.cpus().length;

  if (cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker) => {
      console.log(`worker ${worker.process.pid} died`);
    });
  } else {
    const app = await NestFactory.create(AppModule);

    await app.listen(variables.port);

    console.log(`Worker ${process.pid} started`);
  }
}
bootstrap();
