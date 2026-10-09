import { env } from "../../../../db/runtime";
import { ensureDatabase } from "../../../../db/setup";
import {
  digestToken,
  hashPassword,
  randomToken,
  sessionCookie,
} from "../../../../lib/auth";

type LoginRow = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  classId: string | null;
  role: "STUDENT" | "REFEREE" | "ADMIN";
  avatar: string | null;
  requestedRole: "STUDENT" | "REFEREE" | "ADMIN";
  passwordHash: string;
  passwordSalt: string;
};

export async function POST(request: Request) {
  await ensureDatabase();
  const body = (await request.json()) as {
    identifier?: string;
    password?: string;
  };
  const identifier = body.identifier?.trim().toLowerCase();
  if (!identifier || !body.password)
    return Response.json(
      { error: "Informe usuário e senha." },
      { status: 400 },
    );
  const ip =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const attemptKey = await digestToken(`${ip}:${identifier}`);
  const attempt = await env.DB.prepare(
    "SELECT count, window_started AS windowStarted FROM login_attempts WHERE key = ?",
  )
    .bind(attemptKey)
    .first<{ count: number; windowStarted: string }>();
  const windowOpen =
    attempt &&
    Date.now() - new Date(attempt.windowStarted).getTime() < 15 * 60_000;
  if (windowOpen && attempt.count >= 8)
    return Response.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 },
    );
  const user = await env.DB.prepare(
    `
    SELECT id, first_name AS firstName, last_name AS lastName, username, email,
      class_id AS classId, role, requested_role AS requestedRole, avatar, password_hash AS passwordHash, password_salt AS passwordSalt
    FROM users WHERE (lower(username) = ? OR lower(email) = ?)
      AND id NOT IN ('usr_student', 'usr_referee', 'usr_admin') LIMIT 1
  `,
  )
    .bind(identifier, identifier)
    .first<LoginRow>();
  if (
    !user ||
    (await hashPassword(body.password, user.passwordSalt)) !== user.passwordHash
  ) {
    await env.DB.prepare(
      "INSERT INTO login_attempts (key, count, window_started) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET count = excluded.count, window_started = excluded.window_started",
    )
      .bind(
        attemptKey,
        windowOpen ? (attempt?.count ?? 0) + 1 : 1,
        windowOpen ? attempt!.windowStarted : new Date().toISOString(),
      )
      .run();
    return Response.json(
      { error: "Usuário ou senha inválidos." },
      { status: 401 },
    );
  }
  await env.DB.prepare("DELETE FROM login_attempts WHERE key = ?")
    .bind(attemptKey)
    .run();
  const token = randomToken();
  const expires = new Date(Date.now() + 7 * 86400_000).toISOString();
  await env.DB.batch([
    env.DB.prepare(
      "DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP",
    ),
    env.DB.prepare(
      "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
    ).bind(await digestToken(token), user.id, expires),
  ]);
  const safeUser = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    classId: user.classId,
    role: user.role,
    requestedRole: user.requestedRole,
    avatar: user.avatar,
  };
  return Response.json(
    { user: safeUser },
    { headers: { "Set-Cookie": sessionCookie(token, request) } },
  );
}
