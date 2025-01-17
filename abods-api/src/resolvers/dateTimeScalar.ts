import {
  GraphQLError,
  GraphQLErrorOptions,
  GraphQLScalarType,
  Kind,
  versionInfo,
} from "graphql";
import dayjs from "dayjs";
import logger from "../logger.js";

export type DateTimeServerType = dayjs.Dayjs;
export type DateTimeServerOutputType = dayjs.Dayjs | Date;

export function createGraphQLError(
  message: string,
  options?: GraphQLErrorOptions,
) {
  if (versionInfo.major >= 17) {
    return new GraphQLError(message, options);
  }
  return new GraphQLError(
    message,
    options === null || options === void 0 ? void 0 : options.nodes,
    options === null || options === void 0 ? void 0 : options.source,
    options === null || options === void 0 ? void 0 : options.positions,
    options === null || options === void 0 ? void 0 : options.path,
    options === null || options === void 0 ? void 0 : options.originalError,
    options === null || options === void 0 ? void 0 : options.extensions,
  );
}

const parseDate = (value: unknown) => {
  if (typeof value !== "string") {
    throw createGraphQLError(
      "DateTime cannot represent a non string, or non DateTime type " +
        JSON.stringify(value),
    );
  }
  try {
    return dayjs(value);
  } catch (e) {
    logger.debug(e);
    throw createGraphQLError(
      `DateTime cannot represent an invalid datetime-string ${value}.`,
    );
  }
};

export const DayjsDateTimeResolver = new GraphQLScalarType({
  name: "DateTime",
  description:
    "Date and time values in ISO-8601 format. e.g. 2025-01-01T00:00:00+00:00",
  serialize(value) {
    if (value instanceof Date) return value.toISOString();
    if (!dayjs.isDayjs(value)) {
      throw createGraphQLError(
        "value must be a Dayjs instance " + JSON.stringify(value),
      );
    }
    return value.tz("Europe/London").format();
  },
  parseValue(value) {
    return parseDate(value);
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw createGraphQLError(
        `DateTime cannot represent non string type ${"value" in ast && ast.value}`,
        { nodes: ast },
      );
    }
    const { value } = ast;
    try {
      return parseDate(value);
    } catch (e) {
      logger.debug(e);
      throw createGraphQLError(
        `DateTime cannot represent an invalid datetime-string ${String(value)}.`,
        {
          nodes: ast,
        },
      );
    }
  },
  extensions: {
    codegenScalarType: {
      input: "../resolvers/dateTimeScalar#DateTimeServerType",
      output: "../resolvers/dateTimeScalar#DateTimeServerOutputType",
    },
    jsonSchema: {
      type: "string",
      format: "date-time",
    },
  },
});
