import { Controller, Get, Query } from '@nestjs/common';

import { controllerPaths, betfairPaths } from 'const/routes';
import BetfairDataService from 'services/betfair.service';

export interface IAuthResponse {
  email: string;
  token: string;
  userName: string;
}

@Controller(controllerPaths.BETFAIR)
class BetfairController {
  constructor(private readonly betfairService: BetfairDataService) {}

  @Get(betfairPaths.GET_DATA)
  async getData(@Query() queryData) {
    return this.betfairService.getBetfairData(queryData);
  }

  @Get(betfairPaths.SEARCH_EVENTS_BY_NAME)
  async getEvents(@Query() queryData) {
    return this.betfairService.getEvents(queryData);
  }
}

export default BetfairController;
