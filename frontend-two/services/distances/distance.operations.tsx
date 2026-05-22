export const USER_ORGANISATIONS_QUERY = `
  query userOrganisations {
    userOrgs {
      name
      id
    }
  }
`;

export const ORG_OPERATOR_LIST_QUERY = `
  query orgOperatorList($orgId: Int!) {
    operators(filterBy: { orgId: $orgId }) {
      name
      nocCode
    }
  }
`;

export const DISTANCE_LIST_QUERY = `
  query distancesList($filterBy: DistancesFilterInput!) {
    distances(filterBy: $filterBy) {
      operatorId
      operatorName
      nocLineAndServiceCode
      lineName
      serviceName
      distance
      avlDistance
    }
  }
`;

export const DISTANCES_DROPDOWNS_INPUT_QUERY = `
  query distancesDropdownInput {
    distancesDropdowns {
      operators {
        id
        name
        licenses {
          id
          services {
            id
            name
            line
          }
        }
      }
    }
  }
`;

export const ADMIN_ORG_LIST_QUERY = `
  query adminOrgList {
    adminOrgMap {
      adminAreaId
      adminName
      operatorId
      orgId
      orgName
    }
  }
`;