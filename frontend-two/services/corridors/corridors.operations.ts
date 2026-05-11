export const CORRIDORS_LIST_QUERY = `query corridorsList {
  corridor {
    corridorList {
      id
      name
      stops {
        stopId
      }
    }
  }
}`;
