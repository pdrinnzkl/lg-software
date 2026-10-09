import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const classes = sqliteTable("classes", {
  id: text("id").primaryKey(),
  year: integer("year").notNull(),
  section: text("section").notNull(),
  name: text("name").notNull().unique(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  classId: text("class_id").references(() => classes.id),
  role: text("role", { enum: ["STUDENT", "REFEREE", "ADMIN"] })
    .notNull()
    .default("STUDENT"),
  requestedRole: text("requested_role", {
    enum: ["STUDENT", "REFEREE", "ADMIN"],
  })
    .notNull()
    .default("STUDENT"),
  avatar: text("avatar"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const sports = sqliteTable("sports", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  scoreLabel: text("score_label").notNull().default("Gol"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const matches = sqliteTable("matches", {
  id: text("id").primaryKey(),
  sportId: text("sport_id")
    .notNull()
    .references(() => sports.id),
  homeClassId: text("home_class_id")
    .notNull()
    .references(() => classes.id),
  awayClassId: text("away_class_id")
    .notNull()
    .references(() => classes.id),
  scheduledAt: text("scheduled_at").notNull(),
  venue: text("venue").notNull(),
  status: text("status", {
    enum: ["SCHEDULED", "LIVE", "FINISHED", "CANCELLED"],
  })
    .notNull()
    .default("SCHEDULED"),
  homeScore: integer("home_score").notNull().default(0),
  awayScore: integer("away_score").notNull().default(0),
  refereeId: text("referee_id").references(() => users.id),
  period: integer("period").notNull().default(1),
  clockSeconds: integer("clock_seconds").notNull().default(0),
  clockRunning: integer("clock_running", { mode: "boolean" })
    .notNull()
    .default(false),
  version: integer("version").notNull().default(1),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const matchEvents = sqliteTable("match_events", {
  id: text("id").primaryKey(),
  matchId: text("match_id")
    .notNull()
    .references(() => matches.id),
  side: text("side", { enum: ["HOME", "AWAY", "SYSTEM"] }).notNull(),
  type: text("type").notNull(),
  value: integer("value").notNull().default(0),
  minute: integer("minute").notNull().default(0),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: text("expires_at").notNull(),
});

export const loginAttempts = sqliteTable("login_attempts", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStarted: text("window_started").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
