interface IExodus {
  price: number;
  size: number;
}

interface IExoduses {
  availableToBack: IExodus[];
  availableToLay: IExodus[];
}

interface IRunner {
  selectionId: number;
  lastPriceTraded: number;
  ex: IExoduses;
}

export interface IMarketWithRunners {
  marketId: string;
  runners: IRunner[];
}
