import { env } from "../../../db/runtime";
import { ensureDatabase } from "../../../db/setup";
import { getSessionUser } from "../../../lib/auth";

export async function GET(request: Request) {
  await ensureDatabase();
  const viewer = await getSessionUser(request);
  const [classes, sports, matches, events, users] = await Promise.all([
    env.DB.prepare(
      "SELECT id, year, section, name FROM classes ORDER BY year, section",
    ).all(),
    env.DB.prepare(
      "SELECT id, name, score_label AS scoreLabel, active FROM sports WHERE id <> 'football' ORDER BY name",
    ).all(),
    env.DB.prepare(
      `
      SELECT m.id, m.sport_id AS sportId, s.name AS sport, s.score_label AS scoreLabel,
        m.home_class_id AS homeId, hc.name AS home, m.away_class_id AS awayId, ac.name AS away,
        m.scheduled_at AS scheduledAt, m.venue, m.status, m.home_score AS homeScore,
        m.away_score AS awayScore, m.referee_id AS refereeId,
        trim(coalesce(u.first_name,'') || ' ' || coalesce(u.last_name,'')) AS referee,
        m.period, m.clock_seconds AS clockSeconds, m.clock_running AS clockRunning,
        m.version, m.updated_at AS updatedAt
      FROM matches m
      JOIN sports s ON s.id = m.sport_id
      JOIN classes hc ON hc.id = m.home_class_id
      JOIN classes ac ON ac.id = m.away_class_id
      LEFT JOIN users u ON u.id = m.referee_id
      WHERE m.sport_id <> 'football'
      ORDER BY m.scheduled_at DESC
    `,
    ).all(),
    env.DB.prepare(
      "SELECT id, match_id AS matchId, side, type, value, minute, created_at AS createdAt FROM match_events ORDER BY created_at DESC",
    ).all(),
    viewer?.role === "ADMIN"
      ? env.DB.prepare(
          "SELECT id, first_name AS firstName, last_name AS lastName, username, email, class_id AS classId, role, requested_role AS requestedRole, avatar FROM users WHERE id NOT IN ('usr_student', 'usr_referee', 'usr_admin') ORDER BY first_name",
        ).all()
      : Promise.resolve({ results: [] }),
  ]);
  return Response.json({
    classes: classes.results,
    sports: sports.results,
    matches: matches.results,
    events: events.results,
    users: users.results,
  });
}
