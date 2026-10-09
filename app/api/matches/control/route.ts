import { env } from "../../../../db/runtime";
import { ensureDatabase } from "../../../../db/setup";
import { getSessionUser } from "../../../../lib/auth";

type ControlBody = {
  matchId?: string;
  action?: "score" | "undo" | "toggleClock" | "start" | "finish" | "event";
  side?: "HOME" | "AWAY";
  value?: number;
  type?: string;
  clockSeconds?: number;
};

export async function POST(request: Request) {
  await ensureDatabase();
  const user = await getSessionUser(request);
  if (!user)
    return Response.json(
      { error: "Faça login para continuar." },
      { status: 401 },
    );
  const body = (await request.json()) as ControlBody;
  const match = body.matchId
    ? await env.DB.prepare("SELECT * FROM matches WHERE id = ?")
        .bind(body.matchId)
        .first<Record<string, unknown>>()
    : null;
  if (!match)
    return Response.json({ error: "Partida não encontrada." }, { status: 404 });
  if (
    user.role !== "ADMIN" &&
    !(user.role === "REFEREE" && match.referee_id === user.id)
  ) {
    return Response.json(
      { error: "Você não está autorizado a controlar esta partida." },
      { status: 403 },
    );
  }

  const matchId = body.matchId!;
  if (body.action === "score" && body.side) {
    const value = Math.max(1, Math.min(3, Number(body.value) || 1));
    const column = body.side === "HOME" ? "home_score" : "away_score";
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE matches SET ${column} = ${column} + ?, clock_seconds = ?, status = 'LIVE', version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      ).bind(value, Math.max(0, Number(body.clockSeconds) || 0), matchId),
      env.DB.prepare(
        "INSERT INTO match_events (id, match_id, side, type, value, minute, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ).bind(
        crypto.randomUUID(),
        matchId,
        body.side,
        body.type || (value === 1 ? "Gol / ponto" : `+${value} pontos`),
        value,
        Math.floor(Number(match.clock_seconds ?? 0) / 60),
        user.id,
      ),
    ]);
  } else if (body.action === "event" && body.side && body.type) {
    await env.DB.prepare(
      "INSERT INTO match_events (id, match_id, side, type, value, minute, created_by) VALUES (?, ?, ?, ?, 0, ?, ?)",
    )
      .bind(
        crypto.randomUUID(),
        matchId,
        body.side,
        body.type,
        Math.floor(Number(match.clock_seconds ?? 0) / 60),
        user.id,
      )
      .run();
  } else if (body.action === "undo") {
    const event = await env.DB.prepare(
      "SELECT id, side, value FROM match_events WHERE match_id = ? AND value > 0 ORDER BY created_at DESC LIMIT 1",
    )
      .bind(matchId)
      .first<{ id: string; side: "HOME" | "AWAY"; value: number }>();
    if (event) {
      const column = event.side === "HOME" ? "home_score" : "away_score";
      await env.DB.batch([
        env.DB.prepare(
          `UPDATE matches SET ${column} = MAX(0, ${column} - ?), version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        ).bind(event.value, matchId),
        env.DB.prepare("DELETE FROM match_events WHERE id = ?").bind(event.id),
      ]);
    }
  } else if (body.action === "toggleClock") {
    await env.DB.prepare(
      "UPDATE matches SET clock_seconds = ?, clock_running = CASE clock_running WHEN 1 THEN 0 ELSE 1 END, status = 'LIVE', version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
      .bind(Math.max(0, Number(body.clockSeconds) || 0), matchId)
      .run();
  } else if (body.action === "start") {
    await env.DB.prepare(
      "UPDATE matches SET status = 'LIVE', clock_seconds = ?, clock_running = 1, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
      .bind(Math.max(0, Number(body.clockSeconds) || 0), matchId)
      .run();
  } else if (body.action === "finish") {
    await env.DB.prepare(
      "UPDATE matches SET status = 'FINISHED', clock_seconds = ?, clock_running = 0, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
      .bind(Math.max(0, Number(body.clockSeconds) || 0), matchId)
      .run();
  } else {
    return Response.json({ error: "Ação inválida." }, { status: 400 });
  }
  return Response.json({ ok: true });
}
