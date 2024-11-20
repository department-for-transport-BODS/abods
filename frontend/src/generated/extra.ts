import { Maybe, Scalars } from "./graphql";

export type ICorridorJourneyTimeStats = {
  avgTransitTime?: Maybe<Scalars["Float"]["output"]>;
  maxTransitTime: Scalars["Int"]["output"];
  minTransitTime: Scalars["Int"]["output"];
  percentile25?: Maybe<Scalars["Float"]["output"]>;
  percentile5?: Maybe<Scalars["Float"]["output"]>;
  percentile75?: Maybe<Scalars["Float"]["output"]>;
};

export type IPunctualityType = {
  early?: Maybe<Scalars["Int"]["output"]>;
  late?: Maybe<Scalars["Int"]["output"]>;
  onTime?: Maybe<Scalars["Int"]["output"]>;
};
