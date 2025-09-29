import { readFileSync } from "fs";
import { buildSchema, parse, validate } from "graphql";

describe("GraphQL schema and query validation", () => {
  let schemaSDL: string;
  let schema: ReturnType<typeof buildSchema>;

  beforeAll(() => {
    schemaSDL = readFileSync("./schema.graphql", "utf8");
    schema = buildSchema(schemaSDL);
  });

  it("should validate a sample query against the schema", () => {
    const query = `
      query {
        apiInfo {
          version
          buildNumber
        }
      }
    `;
    const parsedQuery = parse(query);
    const errors = validate(schema, parsedQuery);

    expect(errors.length).toBe(0);
  });
});
