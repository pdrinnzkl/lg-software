import { getLibsqlClient } from "./runtime";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export function getDb() {
  return drizzle(getLibsqlClient(), { schema });
}
