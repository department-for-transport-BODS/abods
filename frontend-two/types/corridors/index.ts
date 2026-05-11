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

export interface CorridorStop {
  stopId: string;
  stopName: string;
  naptan: string;
  localityName: string | null;
  adminAreaId: string | null;
  sourceId: string | null;
  lon: number;
  lat: number;
}

export interface Corridor {
  id: number;
  name: string;
  stops: CorridorStop[];
}

export interface StopLists {
  orgStops: CorridorStop[];
  nonOrgStops: CorridorStop[];
}

export interface CorridorUpdateInput {
  id: number;
  name: string;
  stopList: string[];
}
