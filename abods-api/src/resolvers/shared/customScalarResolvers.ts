import { DateTimeResolver, TimeResolver, DateResolver } from 'graphql-scalars';
import { Resolvers } from '../../types';

export const customScalarResolvers: Resolvers = {
    Date: DateResolver,
    DateTime: DateTimeResolver, 
    Time: TimeResolver
}
