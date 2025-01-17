import {
  GraphQLError,
  GraphQLErrorOptions,
  GraphQLScalarType,
  Kind,
  versionInfo,
} from "graphql";
import dayjs from "dayjs";
import logger from "../logger.js";

export type TimeServerType = dayjs.Dayjs;

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

const parseTime = (value: unknown) => {
  if (typeof value !== "string") {
    throw createGraphQLError(
      "Time cannot represent a non string, or non Time type " +
        JSON.stringify(value),
    );
  }
  try {
    const today = dayjs().format().slice(0, 10);
    return dayjs(`${today}T${value}`);
  } catch (e) {
    logger.debug(e);
    throw createGraphQLError(
      `Time cannot represent an invalid time-string ${value}.`,
    );
  }
};

export const DayjsTimeResolver = new GraphQLScalarType({
  name: "Time",
  description: "Time values in ISO-8601 format. e.g. 00:00:00+00:00",
  serialize(value) {
    if (!dayjs.isDayjs(value)) {
      throw createGraphQLError(
        "value must be a Dayjs instance " + JSON.stringify(value),
      );
    }
    const str = value.tz("Europe/London").format();
    return str.slice(str.indexOf("T") + 1);
  },
  parseValue(value) {
    return parseTime(value);
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw createGraphQLError(
        `Time cannot represent non string type ${"value" in ast && ast.value}`,
        { nodes: ast },
      );
    }
    const { value } = ast;
    try {
      return parseTime(value);
    } catch (e) {
      logger.debug(e);
      throw createGraphQLError(
        `Time cannot represent an invalid time-string ${String(value)}.`,
        {
          nodes: ast,
        },
      );
    }
  },
  extensions: {
    codegenScalarType: {
      input: "../resolvers/timeScalar#TimeServerType",
      output: "../resolvers/timeScalar#TimeServerType",
    },
    jsonSchema: {
      type: "string",
      format: "time",
    },
  },
});
