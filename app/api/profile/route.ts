import { env } from "../../../db/runtime";
import { getSessionUser } from "../../../lib/auth";

const validName = (value: unknown) =>
  typeof value === "string" && /^[a-zA-ZÀ-ÿ' -]{2,60}$/.test(value.trim());

export async function PATCH(request: Request) {
  const user = await getSessionUser(request);
  if (!user)
    return Response.json(
      { error: "Entre para editar seu perfil." },
      { status: 401 },
    );
  const body = (await request.json()) as {
    firstName?: string;
    lastName?: string;
    classId?: string | null;
  };
  if (!validName(body.firstName) || !validName(body.lastName))
    return Response.json(
      { error: "Confira seu nome e sobrenome." },
      { status: 400 },
    );
  const classId =
    typeof body.classId === "string" && body.classId ? body.classId : null;
  if (user.role === "STUDENT" && user.requestedRole === "STUDENT" && !classId)
    return Response.json({ error: "Escolha sua turma." }, { status: 400 });
  if (
    classId &&
    !(await env.DB.prepare("SELECT id FROM classes WHERE id = ?")
      .bind(classId)
      .first())
  )
    return Response.json({ error: "Turma inválida." }, { status: 400 });
  await env.DB.prepare(
    "UPDATE users SET first_name = ?, last_name = ?, class_id = ? WHERE id = ?",
  )
    .bind(body.firstName!.trim(), body.lastName!.trim(), classId, user.id)
    .run();
  return Response.json({
    user: {
      ...user,
      firstName: body.firstName!.trim(),
      lastName: body.lastName!.trim(),
      classId,
    },
  });
}
