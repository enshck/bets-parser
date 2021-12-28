interface IEvent {
  id: string;
  name: string;
}

export interface IEventData {
  event: IEvent;
  marketCount: number;
}
