import { env } from "../../../db/runtime";
import { ensureDatabase } from "../../../db/setup";
import { getSessionUser } from "../../../lib/auth";

export async function POST(request: Request) {
  await ensureDatabase();
  const user = await getSessionUser(request);
  if (!user)
    return Response.json(
      { error: "Faça login para continuar." },
      { status: 401 },
    );
  const body = (await request.json()) as Record<string, string>;
  const canCreateGames = user.role === "ADMIN" || user.role === "REFEREE";
  if (body.action === "createMatch" && !canCreateGames)
    return Response.json(
      { error: "Somente árbitros e professores podem criar partidas." },
      { status: 403 },
    );
  if (body.action !== "createMatch" && user.role !== "ADMIN")
    return Response.json(
      { error: "Esta ação é exclusiva da administração." },
      { status: 403 },
    );
  if (body.action === "createMatch") {
    if (
      !body.sportId ||
      !body.homeId ||
      !body.awayId ||
      !body.scheduledAt ||
      !body.venue ||
      body.homeId === body.awayId
    ) {
      return Response.json(
        { error: "Revise os dados da partida." },
        { status: 400 },
      );
    }
    if (!["futsal", "volleyball", "basketball"].includes(body.sportId)) {
      return Response.json(
        { error: "Modalidade não disponível neste Interclasse." },
        { status: 400 },
      );
    }
    const [sport, homeClass, awayClass] = await Promise.all([
      env.DB.prepare("SELECT id FROM sports WHERE id = ? AND active = 1")
        .bind(body.sportId)
        .first(),
      env.DB.prepare("SELECT id FROM classes WHERE id = ?")
        .bind(body.homeId)
        .first(),
      env.DB.prepare("SELECT id FROM classes WHERE id = ?")
        .bind(body.awayId)
        .first(),
    ]);
    if (!sport || !homeClass || !awayClass)
      return Response.json(
        { error: "Confira a modalidade e as duas turmas selecionadas." },
        { status: 400 },
      );

    const refereeId =
      user.role === "REFEREE" ? user.id : body.refereeId || null;
    if (refereeId) {
      const referee = await env.DB.prepare(
        "SELECT id FROM users WHERE id = ? AND role = 'REFEREE'",
      )
        .bind(refereeId)
        .first();
      if (!referee)
        return Response.json(
          { error: "O árbitro selecionado não tem perfil de arbitragem." },
          { status: 400 },
        );
    }
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO matches (id, sport_id, home_class_id, away_class_id, scheduled_at, venue, referee_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        id,
        body.sportId,
        body.homeId,
        body.awayId,
        body.scheduledAt,
        body.venue,
        refereeId,
      )
      .run();
    return Response.json({ ok: true, id }, { status: 201 });
  }
  if (
    body.action === "setRole" &&
    body.userId &&
    ["STUDENT", "REFEREE", "ADMIN"].includes(body.role)
  ) {
    if (body.userId === user.id && body.role !== "ADMIN")
      return Response.json(
        { error: "Você não pode remover seu próprio acesso de gestão." },
        { status: 400 },
      );
    const target = await env.DB.prepare(
      "SELECT id FROM users WHERE id = ? AND id NOT IN ('usr_student', 'usr_referee', 'usr_admin')",
    )
      .bind(body.userId)
      .first();
    if (!target)
      return Response.json(
        { error: "Usuário não encontrado." },
        { status: 404 },
      );
    await env.DB.prepare(
      "UPDATE users SET role = ?, requested_role = ? WHERE id = ?",
    )
      .bind(body.role, body.role, body.userId)
      .run();
    return Response.json({ ok: true });
  }
  if (body.action === "cancelMatch" && body.matchId) {
    await env.DB.prepare(
      "UPDATE matches SET status = 'CANCELLED', clock_running = 0, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
      .bind(body.matchId)
      .run();
    return Response.json({ ok: true });
  }
  return Response.json({ error: "Ação inválida." }, { status: 400 });
}
