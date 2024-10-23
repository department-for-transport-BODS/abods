import { DateTimeResolver, TimeResolver, DateResolver } from 'graphql-scalars';
import { Resolvers } from '../../types/generated.js';

export const customScalarResolvers: Resolvers = {
    Date: DateResolver,
    DateTime: DateTimeResolver, 
}
