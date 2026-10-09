import { createClient, type Client, type InValue } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

type QueryResult<T> = { results: T[] };
type PreparedStatement = {
  sql: string;
  args: InValue[];
  bind(...values: InValue[]): PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<QueryResult<T>>;
  run(): Promise<unknown>;
};

let client: Client | undefined;

export function getLibsqlClient() {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  if (process.env.NODE_ENV === "production" && !url) {
    throw new Error(
      "Configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to enable persistent accounts.",
    );
  }
  const authToken =
    process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;
  if (url && !url.startsWith("file:") && !authToken) {
    throw new Error("Configure TURSO_AUTH_TOKEN for the remote database.");
  }

  const localPath = resolve(process.cwd(), "data/interclasse.db");
  const localUrl = "file:data/interclasse.db";
  if (!url) mkdirSync(dirname(localPath), { recursive: true });
  client = createClient({
    url: url || localUrl,
    authToken,
  });
  return client;
}

class SqliteStatement implements PreparedStatement {
  args: InValue[] = [];

  constructor(readonly sql: string) {}

  bind(...values: InValue[]) {
    this.args = values;
    return this;
  }

  async first<T>() {
    const result = await getLibsqlClient().execute({
      sql: this.sql,
      args: this.args,
    });
    return (result.rows[0] as T | undefined) ?? null;
  }

  async all<T>() {
    const result = await getLibsqlClient().execute({
      sql: this.sql,
      args: this.args,
    });
    return { results: result.rows as T[] };
  }

  run() {
    return getLibsqlClient().execute({ sql: this.sql, args: this.args });
  }
}

const database = {
  prepare(sql: string) {
    return new SqliteStatement(sql);
  },
  batch(statements: PreparedStatement[]) {
    return getLibsqlClient().batch(
      statements.map(({ sql, args }) => ({ sql, args })),
      "write",
    );
  },
};

// Small SQLite-compatible adapter keeps SQL handlers independent of hosting APIs.
export const env = {
  DB: database,
  ADMIN_SETUP_CODES: readSetupCodes("ADMIN_SETUP_CODES", "ADMIN_SETUP_CODE"),
  REFEREE_SETUP_CODES: readSetupCodes(
    "REFEREE_SETUP_CODES",
    "REFEREE_SETUP_CODE",
  ),
};

function readSetupCodes(listName: string, legacyName: string) {
  return (process.env[listName] || process.env[legacyName] || "")
    .split(/[\n,]/)
    .map((code) => code.trim())
    .filter(Boolean);
}
