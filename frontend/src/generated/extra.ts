import { Maybe, Scalars } from './graphql';


export type ICorridorJourneyTimeStats = {
  avgTransitTime?: Maybe<Scalars['Float']>;
  maxTransitTime: Scalars['Int'];
  minTransitTime: Scalars['Int'];
  percentile25?: Maybe<Scalars['Float']>;
  percentile5?: Maybe<Scalars['Float']>;
  percentile75?: Maybe<Scalars['Float']>;
  percentile95?: Maybe<Scalars['Float']>;
};

export type IPunctualityType = {
  early?: Maybe<Scalars['Int']>;
  late?: Maybe<Scalars['Int']>;
  onTime?: Maybe<Scalars['Int']>;
};
