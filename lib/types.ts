export type Role = "STUDENT" | "REFEREE" | "ADMIN";
export type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED" | "CANCELLED";

export type ClassRow = {
  id: string;
  year: number;
  section: string;
  name: string;
};
export type Sport = {
  id: string;
  name: string;
  scoreLabel: string;
  active: number | boolean;
};
export type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  classId: string | null;
  role: Role;
  requestedRole?: Role;
  avatar?: string | null;
};
export type Match = {
  id: string;
  sportId: string;
  sport: string;
  scoreLabel: string;
  homeId: string;
  home: string;
  awayId: string;
  away: string;
  scheduledAt: string;
  venue: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  refereeId: string | null;
  referee: string | null;
  period: number;
  clockSeconds: number;
  clockRunning: number | boolean;
  version: number;
  updatedAt: string;
};
export type MatchEvent = {
  id: string;
  matchId: string;
  side: "HOME" | "AWAY" | "SYSTEM";
  type: string;
  value: number;
  minute: number;
  createdAt: string;
};
export type ChampionshipData = {
  classes: ClassRow[];
  sports: Sport[];
  matches: Match[];
  events: MatchEvent[];
  users: User[];
};
export type Standing = {
  id: string;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  scored: number;
  conceded: number;
  difference: number;
};

export function calculateStandings(
  data: ChampionshipData,
  year: number | "ALL" = "ALL",
  sportId?: string,
) {
  const eligible = data.classes.filter(
    (team) => year === "ALL" || team.year === year,
  );
  const table = new Map(
    eligible.map((team) => [
      team.id,
      {
        id: team.id,
        name: team.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        points: 0,
        scored: 0,
        conceded: 0,
        difference: 0,
      } satisfies Standing,
    ]),
  );
  data.matches
    .filter(
      (match) =>
        match.status === "FINISHED" && (!sportId || match.sportId === sportId),
    )
    .forEach((match) => {
      const home = table.get(match.homeId);
      const away = table.get(match.awayId);
      if (!home || !away) return;
      home.played++;
      away.played++;
      home.scored += match.homeScore;
      home.conceded += match.awayScore;
      away.scored += match.awayScore;
      away.conceded += match.homeScore;
      if (match.homeScore > match.awayScore) {
        home.won++;
        home.points += 3;
        away.lost++;
      } else if (match.homeScore < match.awayScore) {
        away.won++;
        away.points += 3;
        home.lost++;
      } else {
        home.drawn++;
        away.drawn++;
        home.points++;
        away.points++;
      }
      home.difference = home.scored - home.conceded;
      away.difference = away.scored - away.conceded;
    });
  return [...table.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.difference - a.difference ||
      b.scored - a.scored ||
      a.name.localeCompare(b.name),
  );
}

export const statusLabels: Record<MatchStatus, string> = {
  SCHEDULED: "Agendado",
  LIVE: "Em andamento",
  FINISHED: "Finalizado",
  CANCELLED: "Cancelado",
};

export function formatGameDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  })
    .format(new Date(date))
    .replace(".", "");
}

export function formatGameTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
