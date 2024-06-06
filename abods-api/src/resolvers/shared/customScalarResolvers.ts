import { DateTimeResolver, TimeResolver, DateResolver } from 'graphql-scalars';

export const customScalarResolvers = {
    Date: DateResolver,
    DateTime: DateTimeResolver, 
    Time: TimeResolver
}
