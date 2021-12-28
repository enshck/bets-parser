interface IEvent {
  id: string;
  name: string;
}

export interface ISport {
  eventType: IEvent;
  marketCount: number;
}
