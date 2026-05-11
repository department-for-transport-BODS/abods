export interface CorridorListItem {
  id: number;
  name: string;
  stops: Array<{ stopId: string } | null> | null;
}

export interface CorridorSummary {
  id: number;
  name: string;
  numStops: number;
}
