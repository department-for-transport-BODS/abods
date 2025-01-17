import {
  GraphQLError,
  GraphQLErrorOptions,
  GraphQLScalarType,
  Kind,
  versionInfo,
} from "graphql";
import dayjs from "dayjs";
import logger from "../logger.js";

export type DateServerType = dayjs.Dayjs;

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
      "Date cannot represent a non string, or non Date type " +
        JSON.stringify(value),
    );
  }
  try {
    return dayjs(value.slice(0, 10));
  } catch (e) {
    logger.debug(e);
    throw createGraphQLError(
      `Date cannot represent an invalid date-string ${value}.`,
    );
  }
};

export const DayjsDateResolver = new GraphQLScalarType({
  name: "Date",
  description: "Date only values in ISO-8601 format. e.g. 2025-01-01",
  serialize(value) {
    if (!dayjs.isDayjs(value)) {
      throw createGraphQLError(
        "value must be a Dayjs instance " + JSON.stringify(value),
      );
    }
    return value.format("YYYY-MM-DD");
  },
  parseValue(value) {
    return parseDate(value);
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw createGraphQLError(
        `Date cannot represent non string type ${"value" in ast && ast.value}`,
        { nodes: ast },
      );
    }
    const { value } = ast;
    try {
      return parseDate(value);
    } catch (e) {
      logger.debug(e);
      throw createGraphQLError(
        `Date cannot represent an invalid date-string ${String(value)}.`,
        {
          nodes: ast,
        },
      );
    }
  },
  extensions: {
    codegenScalarType: {
      input: "../resolvers/dateScalar#DateServerType",
      output: "../resolvers/dateScalar#DateServerType",
    },
    jsonSchema: {
      type: "string",
      format: "date",
    },
  },
});
