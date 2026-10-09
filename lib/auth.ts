import { env } from "../db/runtime";
import { ensureDatabase } from "../db/setup";

const encoder = new TextEncoder();

function hex(bytes: ArrayBuffer | Uint8Array) {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return [...array].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: encoder.encode(salt),
      iterations: 120_000,
    },
    key,
    256,
  );
  return hex(bits);
}

export async function digestToken(token: string) {
  return hex(await crypto.subtle.digest("SHA-256", encoder.encode(token)));
}

export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return hex(bytes);
}

function readCookie(request: Request, name: string) {
  const cookie = request.headers.get("cookie") ?? "";
  const found = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return found?.slice(name.length + 1) ?? null;
}

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  classId: string | null;
  role: "STUDENT" | "REFEREE" | "ADMIN";
  requestedRole: "STUDENT" | "REFEREE" | "ADMIN";
  avatar: string | null;
};

export async function getSessionUser(
  request: Request,
): Promise<AuthUser | null> {
  await ensureDatabase();
  const token = readCookie(request, "lgf_session");
  if (!token) return null;
  const tokenHash = await digestToken(token);
  const row = await env.DB.prepare(
    `
    SELECT u.id, u.first_name AS firstName, u.last_name AS lastName, u.username,
           u.email, u.class_id AS classId, u.role, u.requested_role AS requestedRole, u.avatar
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP
      AND u.id NOT IN ('usr_student', 'usr_referee', 'usr_admin')
  `,
  )
    .bind(tokenHash)
    .first<AuthUser>();
  return row ?? null;
}

export function sessionCookie(
  token: string,
  request: Request,
  maxAge = 60 * 60 * 24 * 7,
) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `lgf_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function clearSessionCookie(request: Request) {
  return sessionCookie("", request, 0);
}

export function publicUser(user: AuthUser) {
  return user;
}
