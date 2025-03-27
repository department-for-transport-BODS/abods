import { DB as db, Timestamp } from "./kysely.generated";
import { Generated } from "kysely";

// Materialised views are not visible with normal introspection
export type DB = db & {
  expected_services: {
    line_name: string;
    noc_and_line_and_servicecode: string;
    service_name: string;
    date_of_journey: Timestamp;
    operator_noc: string;
    admin_area_id: (number | null)[];
  };
  noc_adminarea: {
    national_operator_code: string;
    adminarea_id: number;
  };
  // For some reason codegen didn't correctly identify the id column as generated. There might be something to change in the db
  Alert: db["Alert"] & {
    id: Generated<string>;
  };
};
