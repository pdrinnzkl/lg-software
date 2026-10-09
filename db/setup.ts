import { env } from "./runtime";

let ready: Promise<void> | null = null;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS classes (id TEXT PRIMARY KEY, year INTEGER NOT NULL, section TEXT NOT NULL, name TEXT NOT NULL UNIQUE)`,
  `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL, username TEXT NOT NULL UNIQUE, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, class_id TEXT REFERENCES classes(id), role TEXT NOT NULL DEFAULT 'STUDENT' CHECK(role IN ('STUDENT','REFEREE','ADMIN')), requested_role TEXT NOT NULL DEFAULT 'STUDENT', avatar TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS sports (id TEXT PRIMARY KEY, name TEXT NOT NULL, score_label TEXT NOT NULL DEFAULT 'Gol', active INTEGER NOT NULL DEFAULT 1)`,
  `CREATE TABLE IF NOT EXISTS matches (id TEXT PRIMARY KEY, sport_id TEXT NOT NULL REFERENCES sports(id), home_class_id TEXT NOT NULL REFERENCES classes(id), away_class_id TEXT NOT NULL REFERENCES classes(id), scheduled_at TEXT NOT NULL, venue TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK(status IN ('SCHEDULED','LIVE','FINISHED','CANCELLED')), home_score INTEGER NOT NULL DEFAULT 0, away_score INTEGER NOT NULL DEFAULT 0, referee_id TEXT REFERENCES users(id), period INTEGER NOT NULL DEFAULT 1, clock_seconds INTEGER NOT NULL DEFAULT 0, clock_running INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS match_events (id TEXT PRIMARY KEY, match_id TEXT NOT NULL REFERENCES matches(id), side TEXT NOT NULL CHECK(side IN ('HOME','AWAY','SYSTEM')), type TEXT NOT NULL, value INTEGER NOT NULL DEFAULT 0, minute INTEGER NOT NULL DEFAULT 0, created_by TEXT REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS login_attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0, window_started TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_matches_schedule ON matches(scheduled_at)`,
  `CREATE INDEX IF NOT EXISTS idx_matches_referee_status ON matches(referee_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_events_match_created ON match_events(match_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)`,
];

const initialAccessSettings = [
  ["admin_setup_code_used", "0"],
  ["referee_setup_code_used", "0"],
] as const;

async function initialize() {
  const db = env.DB;
  if (!db) throw new Error("SQLite database adapter is unavailable");
  await db.batch(schemaStatements.map((statement) => db.prepare(statement)));
  await db.batch(
    initialAccessSettings.map(([key, value]) =>
      db
        .prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)")
        .bind(key, value),
    ),
  );
  const existing = await db
    .prepare("SELECT COUNT(*) AS count FROM classes")
    .first<{ count: number }>();
  if ((existing?.count ?? 0) > 0) return;

  const classRows = [
    ["1A", 1, "A", "1º A"],
    ["1B", 1, "B", "1º B"],
    ["1C", 1, "C", "1º C"],
    ["2A", 2, "A", "2º A"],
    ["2B", 2, "B", "2º B"],
    ["2C", 2, "C", "2º C"],
    ["3A", 3, "A", "3º A"],
    ["3B", 3, "B", "3º B"],
    ["3C", 3, "C", "3º C"],
  ] as const;
  await db.batch(
    classRows.map((row) =>
      db
        .prepare(
          "INSERT INTO classes (id, year, section, name) VALUES (?, ?, ?, ?)",
        )
        .bind(...row),
    ),
  );

  await db.batch([
    db
      .prepare("INSERT INTO sports (id, name, score_label) VALUES (?, ?, ?)")
      .bind("futsal", "Futsal", "Gol"),
    db
      .prepare("INSERT INTO sports (id, name, score_label) VALUES (?, ?, ?)")
      .bind("volleyball", "Vôlei", "Ponto"),
    db
      .prepare("INSERT INTO sports (id, name, score_label) VALUES (?, ?, ?)")
      .bind("basketball", "Basquete", "Ponto"),
  ]);

  const matchRows = [
    [
      "match-live",
      "futsal",
      "3A",
      "2B",
      "2026-08-20T14:30:00-03:00",
      "Quadra principal",
      "LIVE",
      2,
      1,
      null,
      1,
      1122,
      0,
    ],
    [
      "match-002",
      "volleyball",
      "1B",
      "1C",
      "2026-08-20T15:20:00-03:00",
      "Quadra principal",
      "SCHEDULED",
      0,
      0,
      null,
      1,
      0,
      0,
    ],
    [
      "match-003",
      "basketball",
      "3B",
      "2A",
      "2026-08-20T16:10:00-03:00",
      "Ginásio",
      "SCHEDULED",
      0,
      0,
      null,
      1,
      0,
      0,
    ],
    [
      "match-005",
      "futsal",
      "3B",
      "1C",
      "2026-08-19T13:40:00-03:00",
      "Quadra principal",
      "FINISHED",
      4,
      2,
      null,
      2,
      2400,
      0,
    ],
    [
      "match-006",
      "volleyball",
      "2B",
      "3C",
      "2026-08-19T15:00:00-03:00",
      "Quadra principal",
      "FINISHED",
      1,
      2,
      null,
      3,
      0,
      0,
    ],
    [
      "match-008",
      "basketball",
      "1A",
      "1B",
      "2026-08-18T14:00:00-03:00",
      "Ginásio",
      "FINISHED",
      38,
      42,
      null,
      4,
      2400,
      0,
    ],
  ] as const;
  await db.batch(
    matchRows.map((row) =>
      db
        .prepare(
          "INSERT INTO matches (id, sport_id, home_class_id, away_class_id, scheduled_at, venue, status, home_score, away_score, referee_id, period, clock_seconds, clock_running) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(...row),
    ),
  );

  await db.batch([
    db
      .prepare(
        "INSERT INTO match_events (id, match_id, side, type, value, minute, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind("evt-1", "match-live", "HOME", "Gol", 1, 12, null),
    db
      .prepare(
        "INSERT INTO match_events (id, match_id, side, type, value, minute, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind("evt-2", "match-live", "AWAY", "Cartão amarelo", 0, 18, null),
    db
      .prepare(
        "INSERT INTO match_events (id, match_id, side, type, value, minute, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind("evt-3", "match-live", "AWAY", "Gol", 1, 23, null),
    db
      .prepare(
        "INSERT INTO match_events (id, match_id, side, type, value, minute, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind("evt-4", "match-live", "HOME", "Gol", 1, 29, null),
    db
      .prepare("INSERT INTO settings (key, value) VALUES (?, ?)")
      .bind("championship_name", "Interclasse LGF 2026"),
  ]);
  await db.prepare("PRAGMA optimize").run();
}

export function ensureDatabase() {
  ready ??= initialize();
  return ready;
}
