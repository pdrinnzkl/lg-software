import { env } from "../../../../db/runtime";
import { ensureDatabase } from "../../../../db/setup";
import {
  digestToken,
  hashPassword,
  randomToken,
  sessionCookie,
} from "../../../../lib/auth";

export async function POST(request: Request) {
  await ensureDatabase();
  const body = (await request.json()) as Record<string, string>;
  const required = ["firstName", "lastName", "username", "email", "password"];
  if (required.some((key) => !body[key]?.trim()))
    return Response.json(
      { error: "Preencha todos os campos." },
      { status: 400 },
    );
  if (body.password.length < 10)
    return Response.json(
      { error: "A senha deve ter pelo menos 10 caracteres." },
      { status: 400 },
    );
  const username = body.username.trim();
  const email = body.email.trim().toLowerCase();
  if (
    !/^[a-zA-ZÀ-ÿ' -]{2,60}$/.test(body.firstName.trim()) ||
    !/^[a-zA-ZÀ-ÿ' -]{2,60}$/.test(body.lastName.trim())
  )
    return Response.json(
      { error: "Informe seu nome completo." },
      { status: 400 },
    );
  if (
    !/^[a-z0-9._-]{3,30}$/i.test(username) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  )
    return Response.json(
      { error: "Usuário ou e-mail inválido." },
      { status: 400 },
    );
  const requestedRole = ["STUDENT", "REFEREE", "ADMIN"].includes(
    body.requestedRole,
  )
    ? body.requestedRole
    : "STUDENT";
  const classId = body.classId?.trim() || null;
  if (requestedRole === "STUDENT" && !classId)
    return Response.json({ error: "Escolha sua turma." }, { status: 400 });
  if (
    classId &&
    !(await env.DB.prepare("SELECT id FROM classes WHERE id = ?")
      .bind(classId)
      .first())
  )
    return Response.json({ error: "Turma inválida." }, { status: 400 });
  const existingAdmins = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM users WHERE role = 'ADMIN' AND id <> 'usr_admin'",
  ).first<{ count: number }>();
  const adminCodeIndex = env.ADMIN_SETUP_CODES.indexOf(body.setupCode);
  const refereeCodeIndex = env.REFEREE_SETUP_CODES.indexOf(body.setupCode);
  const isAuthorizedTeacher =
    requestedRole === "ADMIN" &&
    adminCodeIndex >= 0 &&
    (adminCodeIndex > 0 || (existingAdmins?.count ?? 0) === 0);
  const isAuthorizedReferee =
    requestedRole === "REFEREE" && refereeCodeIndex >= 0;
  const duplicate = await env.DB.prepare(
    "SELECT id FROM users WHERE lower(username) = ? OR lower(email) = ?",
  )
    .bind(username.toLowerCase(), email)
    .first();
  if (duplicate)
    return Response.json(
      { error: "Usuário ou e-mail já cadastrado." },
      { status: 409 },
    );

  let grantedRole: "STUDENT" | "REFEREE" | "ADMIN" = "STUDENT";
  let claimedSetupSetting: string | null = null;
  let legacySetupSetting: string | null = null;
  if (body.setupCode) {
    if (isAuthorizedTeacher) {
      grantedRole = "ADMIN";
    } else if (isAuthorizedReferee) {
      grantedRole = "REFEREE";
    } else {
      return Response.json(
        { error: "Código inválido, de outro perfil ou já utilizado." },
        { status: 400 },
      );
    }
    const codeHash = await digestToken(body.setupCode);
    claimedSetupSetting = `setup_code_used_${codeHash}`;
    const claimed = await env.DB.prepare(
      "INSERT INTO settings (key, value) VALUES (?, '1') ON CONFLICT(key) DO NOTHING RETURNING key",
    )
      .bind(claimedSetupSetting)
      .first();
    if (!claimed)
      return Response.json(
        { error: "Este código de acesso já foi utilizado." },
        { status: 409 },
      );
  }
  if (adminCodeIndex === 0) legacySetupSetting = "admin_setup_code_used";
  if (refereeCodeIndex === 0) legacySetupSetting = "referee_setup_code_used";
  if (legacySetupSetting) {
    const legacyClaim = await env.DB.prepare(
      "UPDATE settings SET value = '1' WHERE key = ? AND value = '0' RETURNING key",
    )
      .bind(legacySetupSetting)
      .first();
    if (!legacyClaim) {
      await env.DB.prepare("DELETE FROM settings WHERE key = ?")
        .bind(claimedSetupSetting)
        .run();
      return Response.json(
        { error: "Este código de acesso já foi utilizado." },
        { status: 409 },
      );
    }
  }

  const id = crypto.randomUUID();
  const salt = randomToken().slice(0, 32);
  const passwordHash = await hashPassword(body.password, salt);
  const token = randomToken();
  try {
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO users (id, first_name, last_name, username, email, password_hash, password_salt, class_id, role, requested_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).bind(
        id,
        body.firstName.trim(),
        body.lastName.trim(),
        username,
        email,
        passwordHash,
        salt,
        classId,
        grantedRole,
        requestedRole,
      ),
      env.DB.prepare(
        "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
      ).bind(
        await digestToken(token),
        id,
        new Date(Date.now() + 7 * 86400_000).toISOString(),
      ),
    ]);
  } catch (error) {
    if (claimedSetupSetting)
      await env.DB.prepare(
        "DELETE FROM settings WHERE key = ? AND NOT EXISTS (SELECT 1 FROM users WHERE id = ?)",
      )
        .bind(claimedSetupSetting, id)
        .run();
    if (legacySetupSetting)
      await env.DB.prepare(
        "UPDATE settings SET value = '0' WHERE key = ? AND value = '1' AND NOT EXISTS (SELECT 1 FROM users WHERE id = ?)",
      )
        .bind(legacySetupSetting, id)
        .run();
    throw error;
  }
  return Response.json(
    {
      user: {
        id,
        firstName: body.firstName,
        lastName: body.lastName,
        username,
        email,
        classId,
        role: grantedRole,
        requestedRole,
      },
    },
    { status: 201, headers: { "Set-Cookie": sessionCookie(token, request) } },
  );
}
