interface IEvent {
  id: string;
  name: string;
}

export interface IMarket {
  event: IEvent;
  marketId: string;
  marketName: string;
  totalMatched: number;
}
