"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  CircleDot,
  Clock3,
  Home,
  LayoutDashboard,
  MapPin,
  Medal,
  Menu,
  Plus,
  Radio,
  Shield,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { SplineScene } from "../../components/ui/spline-scene";
import { ProfileEditor } from "./ProfileEditor";
import { useChampionship } from "../data/useChampionship";
import {
  ClassRow,
  calculateStandings,
  formatGameDate,
  formatGameTime,
  Match,
  Sport,
  statusLabels,
  User,
} from "../../lib/types";

export type SystemPage =
  | "dashboard"
  | "agenda"
  | "standings"
  | "sports"
  | "profile"
  | "match"
  | "referee"
  | "admin";

const navItems = [
  { page: "dashboard", href: "/app", label: "Início", icon: Home },
  { page: "agenda", href: "/app/agenda", label: "Jogos", icon: CalendarDays },
  {
    page: "standings",
    href: "/app/classificacao",
    label: "Classificação",
    icon: Trophy,
  },
  {
    page: "sports",
    href: "/app/modalidades",
    label: "Modalidades",
    icon: CircleDot,
  },
  {
    page: "profile",
    href: "/app/perfil",
    label: "Perfil",
    icon: CircleUserRound,
  },
] as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}
function roleLabel(role: User["role"]) {
  return role === "ADMIN"
    ? "Administrador"
    : role === "REFEREE"
      ? "Árbitro"
      : "Aluno";
}

function Sidebar({
  user,
  active,
  open,
  close,
}: {
  user: User;
  active: SystemPage;
  open: boolean;
  close: () => void;
}) {
  return (
    <aside className={`app-sidebar ${open ? "is-open" : ""}`}>
      <div className="sidebar-head">
        <Link href="/" className="app-brand">
          <span>
            <Image
              src="/logo-escola.png"
              alt="Logo da escola"
              width={44}
              height={44}
            />
          </span>
          <div>
            <strong>LGF</strong>
            <small>INTERCLASSE</small>
          </div>
        </Link>
        <button
          className="sidebar-close"
          onClick={close}
          aria-label="Fechar menu"
        >
          <X size={19} />
        </button>
      </div>
      <div className="season-pill">
        <span>Temporada</span>
        <strong>
          2026 <i>ATIVA</i>
        </strong>
      </div>
      <nav className="sidebar-nav" aria-label="Sistema">
        <p>CAMPEONATO</p>
        {navItems.map((item) => (
          <Link
            onClick={close}
            className={active === item.page ? "active" : ""}
            href={item.href}
            key={item.page}
          >
            <item.icon size={17} />
            <span>{item.label}</span>
            {active === item.page && <i />}
          </Link>
        ))}
        {user.role === "REFEREE" && (
          <>
            <p>ARBITRAGEM</p>
            <Link
              onClick={close}
              className={active === "referee" ? "active special" : "special"}
              href="/arbitragem"
            >
              <ShieldCheck size={17} />
              <span>Meus jogos</span>
              <i />
            </Link>
          </>
        )}
        {user.role === "ADMIN" && (
          <>
            <p>GESTÃO</p>
            <Link
              onClick={close}
              className={active === "admin" ? "active special" : "special"}
              href="/admin"
            >
              <LayoutDashboard size={17} />
              <span>Administração</span>
              <i />
            </Link>
          </>
        )}
      </nav>
      <div className="sidebar-profile">
        <div className="mini-avatar">
          {initials(`${user.firstName} ${user.lastName}`)}
        </div>
        <div>
          <strong>
            {user.firstName} {user.lastName}
          </strong>
          <span>
            {roleLabel(user.role)}
            {user.classId ? ` · ${user.classId[0]}º ${user.classId[1]}` : ""}
          </span>
        </div>
        <ChevronDown size={14} />
      </div>
    </aside>
  );
}

function AppTopbar({
  title,
  menu,
  live = false,
}: {
  title: string;
  menu: () => void;
  live?: boolean;
}) {
  return (
    <header className="app-topbar">
      <button className="menu-button" onClick={menu} aria-label="Abrir menu">
        <Menu size={19} />
      </button>
      <div>
        <p>
          INTERCLASSE LGF / <strong>{title.toUpperCase()}</strong>
        </p>
        {live && (
          <span className="topbar-live">
            <i /> DADOS AO VIVO
          </span>
        )}
      </div>
      <div className="topbar-actions">
        <button aria-label="Notificações">
          <Bell size={17} />
          <i />
        </button>
        <span>20 AGO 2026</span>
      </div>
    </header>
  );
}

function PageHeading({
  kicker,
  title,
  description,
  action,
}: {
  kicker: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p>{kicker}</p>
        <h1>{title}</h1>
        {description && <span>{description}</span>}
      </div>
      {action}
    </div>
  );
}

function TeamBadge({ team, small = false }: { team: string; small?: boolean }) {
  const clean = team.replace("º", "");
  return (
    <span className={`team-badge ${small ? "small" : ""}`}>
      <i>{clean[0]}º</i>
      <strong>{clean.slice(-1)}</strong>
    </span>
  );
}

function StatusPill({ status }: { status: Match["status"] }) {
  return (
    <span className={`status-pill ${status.toLowerCase()}`}>
      {status === "LIVE" && <i />}
      {statusLabels[status]}
    </span>
  );
}

function MatchCard({ match }: { match: Match }) {
  const hasScore = match.status === "LIVE" || match.status === "FINISHED";
  return (
    <Link href={`/app/partidas/${match.id}`} className="match-card">
      <div className="match-card-top">
        <span>{match.sport.toUpperCase()}</span>
        <StatusPill status={match.status} />
      </div>
      <div className="match-card-score">
        <div>
          <TeamBadge team={match.home} />
          <strong>{match.home}</strong>
        </div>
        <b>
          {hasScore ? (
            <>
              {match.homeScore}
              <i>:</i>
              {match.awayScore}
            </>
          ) : (
            <i>VS</i>
          )}
        </b>
        <div>
          <TeamBadge team={match.away} />
          <strong>{match.away}</strong>
        </div>
      </div>
      <div className="match-card-meta">
        <span>
          <Clock3 size={13} />
          {formatGameTime(match.scheduledAt)}
        </span>
        <span>
          <MapPin size={13} />
          {match.venue}
        </span>
        <ArrowRight size={15} />
      </div>
    </Link>
  );
}

function MatchCreationForm({
  classes,
  sports,
  referees,
  onCreate,
  busy,
  buttonLabel = "AGENDAR PARTIDA",
}: {
  classes: ClassRow[];
  sports: Sport[];
  referees?: User[];
  onCreate: (values: Record<string, string>) => Promise<boolean>;
  busy: boolean;
  buttonLabel?: string;
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries()) as Record<
      string,
      string
    >;
    if (await onCreate(values)) form.reset();
  }

  return (
    <form className="admin-create-form" onSubmit={submit}>
      <div className="section-head">
        <div>
          <p>NOVA PARTIDA</p>
          <h2>Agendar jogo</h2>
        </div>
      </div>
      <label>
        Modalidade
        <select name="sportId" required>
          <option value="">Selecione</option>
          {sports.map((sport) => (
            <option value={sport.id} key={sport.id}>
              {sport.name}
            </option>
          ))}
        </select>
      </label>
      <div className="form-grid">
        <label>
          Turma A
          <select name="homeId" required>
            <option value="">Selecione</option>
            {classes.map((team) => (
              <option value={team.id} key={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Turma B
          <select name="awayId" required>
            <option value="">Selecione</option>
            {classes.map((team) => (
              <option value={team.id} key={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Data e horário
        <input name="scheduledAt" type="datetime-local" required />
      </label>
      <label>
        Local
        <input name="venue" defaultValue="Quadra principal" required />
      </label>
      {referees && (
        <label>
          Árbitro
          <select name="refereeId">
            <option value="">A definir</option>
            {referees.map((referee) => (
              <option value={referee.id} key={referee.id}>
                {referee.firstName} {referee.lastName}
              </option>
            ))}
          </select>
        </label>
      )}
      <button className="submit-button" disabled={busy}>
        {busy ? "SALVANDO..." : buttonLabel}
        <ArrowRight size={15} />
      </button>
    </form>
  );
}

function DashboardPage({
  user,
  matches,
  standings,
}: {
  user: User;
  matches: Match[];
  standings: ReturnType<typeof calculateStandings>;
}) {
  const userClass = user.classId;
  const next =
    matches
      .filter(
        (match) =>
          match.status === "SCHEDULED" &&
          (!userClass || [match.homeId, match.awayId].includes(userClass)),
      )
      .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))[0] ||
    matches.find((match) => match.status === "SCHEDULED") ||
    matches[0];
  const live = matches.find((match) => match.status === "LIVE");
  const results = matches
    .filter((match) => match.status === "FINISHED")
    .slice(0, 3);
  const position = Math.max(
    0,
    standings.findIndex((row) => row.id === userClass),
  );
  return (
    <>
      <PageHeading
        kicker="PAINEL DO ALUNO"
        title={`Bom dia, ${user.firstName}.`}
        description="Seu campeonato, atualizado lance a lance."
        action={
          <div className="weather-note">
            <Sparkles size={15} />
            <div>
              <strong>Dia de jogo</strong>
              <span>Quadra principal · 24°C</span>
            </div>
          </div>
        }
      />
      <section className="dashboard-hero">
        <div className="next-match-feature">
          <div className="feature-label">
            <span>PRÓXIMO JOGO DA SUA TURMA</span>
            <StatusPill status={next?.status || "SCHEDULED"} />
          </div>
          {next && (
            <>
              <div className="feature-score">
                <div>
                  <TeamBadge team={next.home} />
                  <strong>{next.home}</strong>
                  <small>
                    {next.homeId === userClass ? "SUA TURMA" : "MANDANTE"}
                  </small>
                </div>
                <div className="feature-vs">
                  <span>{formatGameDate(next.scheduledAt)}</span>
                  <b>VS</b>
                  <i>{formatGameTime(next.scheduledAt)}</i>
                </div>
                <div>
                  <TeamBadge team={next.away} />
                  <strong>{next.away}</strong>
                  <small>
                    {next.awayId === userClass ? "SUA TURMA" : "VISITANTE"}
                  </small>
                </div>
              </div>
              <div className="feature-foot">
                <span>
                  <CircleDot size={14} />
                  {next.sport}
                </span>
                <span>
                  <MapPin size={14} />
                  {next.venue}
                </span>
                <Link href={`/app/partidas/${next.id}`}>
                  Ver partida <ArrowRight size={14} />
                </Link>
              </div>
            </>
          )}
        </div>
        <div className="dashboard-position">
          <div className="position-ring">
            <span>POSIÇÃO DA TURMA</span>
            <strong>#{position + 1 || "—"}</strong>
            <small>GERAL</small>
          </div>
          <div className="position-foot">
            <span>
              {userClass ? `${userClass[0]}º ${userClass[1]}` : "Sem turma"}
            </span>
            <b>{standings[position]?.points ?? 0} PTS</b>
          </div>
        </div>
      </section>
      <section className="dashboard-grid">
        <div className="dashboard-section wide">
          <div className="section-head">
            <div>
              <p>AGENDA</p>
              <h2>Próximos jogos</h2>
            </div>
            <Link href="/app/agenda">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="match-card-grid">
            {matches
              .filter((match) => match.status === "SCHEDULED")
              .slice(0, 2)
              .map((match) => (
                <MatchCard match={match} key={match.id} />
              ))}
          </div>
        </div>
        <div className="dashboard-section">
          <div className="section-head">
            <div>
              <p>TABELA GERAL</p>
              <h2>Classificação</h2>
            </div>
            <Link href="/app/classificacao">
              Completa <ArrowRight size={14} />
            </Link>
          </div>
          <div className="compact-ranking">
            {standings.slice(0, 5).map((row, index) => (
              <div key={row.id} className={row.id === userClass ? "mine" : ""}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{row.name}</strong>
                <i>
                  {row.won}V · {row.lost}D
                </i>
                <b>{row.points}</b>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="dashboard-bottom">
        <div className="section-head">
          <div>
            <p>PLACARES</p>
            <h2>Últimos resultados</h2>
          </div>
        </div>
        <div className="result-strip">
          {results.map((match) => (
            <Link key={match.id} href={`/app/partidas/${match.id}`}>
              <span>{match.sport.toUpperCase()}</span>
              <div>
                <strong>{match.home}</strong>
                <b>
                  {match.homeScore} <i>×</i> {match.awayScore}
                </b>
                <strong>{match.away}</strong>
              </div>
              <small>{formatGameDate(match.scheduledAt)}</small>
            </Link>
          ))}
        </div>
        {live && (
          <Link className="live-banner" href={`/app/partidas/${live.id}`}>
            <span>
              <Radio size={15} /> PARTIDA AO VIVO
            </span>
            <strong>
              {live.home}{" "}
              <i>
                {live.homeScore} : {live.awayScore}
              </i>{" "}
              {live.away}
            </strong>
            <b>
              Acompanhar <ArrowRight size={14} />
            </b>
          </Link>
        )}
      </section>
    </>
  );
}

function AgendaPage({ matches }: { matches: Match[] }) {
  const [filter, setFilter] = useState(() => {
    if (typeof window === "undefined") return "Todos";
    const requested = new URLSearchParams(window.location.search).get(
      "modalidade",
    );
    const names: Record<string, string> = {
      futsal: "Futsal",
      volleyball: "Vôlei",
      basketball: "Basquete",
    };
    return requested && names[requested] ? names[requested] : "Todos";
  });
  const filters = [
    "Todos",
    "Hoje",
    "Próximos",
    "Finalizados",
    "Futsal",
    "Vôlei",
    "Basquete",
  ];
  const filtered = matches
    .filter((match) => {
      if (filter === "Todos") return true;
      if (filter === "Hoje") return match.scheduledAt.startsWith("2026-08-20");
      if (filter === "Próximos") return match.status === "SCHEDULED";
      if (filter === "Finalizados") return match.status === "FINISHED";
      return match.sport === filter;
    })
    .sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt));
  const today = filtered.filter((match) =>
    match.scheduledAt.startsWith("2026-08-20"),
  );
  const others = filtered.filter(
    (match) => !match.scheduledAt.startsWith("2026-08-20"),
  );
  return (
    <>
      <PageHeading
        kicker="CAMPEONATO / JOGOS"
        title="Agenda"
        description="Horários, locais e placares em um só lugar."
      />
      <div className="filter-tabs" role="tablist" aria-label="Filtrar partidas">
        {filters.map((item) => (
          <button
            role="tab"
            aria-selected={filter === item}
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </div>
      {today.length > 0 && (
        <section className="agenda-day">
          <div className="agenda-date">
            <span>HOJE</span>
            <strong>20</strong>
            <i>AGO · QUI</i>
            <b>{today.length} jogos</b>
          </div>
          <div className="agenda-list">
            {today.map((match) => (
              <MatchCard match={match} key={match.id} />
            ))}
          </div>
        </section>
      )}
      {others.length > 0 && (
        <section className="agenda-day">
          <div className="agenda-date">
            <span>OUTRAS DATAS</span>
            <strong>+</strong>
            <i>AGENDA</i>
            <b>{others.length} jogos</b>
          </div>
          <div className="agenda-list">
            {others.map((match) => (
              <MatchCard match={match} key={match.id} />
            ))}
          </div>
        </section>
      )}
      {filtered.length === 0 && (
        <div className="empty-state">
          <CalendarDays />
          <h2>Nenhum jogo neste filtro.</h2>
          <p>Escolha outra visualização da agenda.</p>
        </div>
      )}
    </>
  );
}

function StandingsPage({
  data,
}: {
  data: ReturnType<typeof useChampionship>["data"];
}) {
  const [year, setYear] = useState<number | "ALL">("ALL");
  const [sport, setSport] = useState("");
  const standings = useMemo(
    () => calculateStandings(data, year, sport || undefined),
    [data, year, sport],
  );
  return (
    <>
      <PageHeading
        kicker="DESEMPENHO"
        title="Classificação"
        description="Calculada automaticamente a partir dos resultados finalizados."
        action={
          <div className="auto-badge">
            <Activity size={15} />
            <span>
              <strong>ATUALIZAÇÃO AUTOMÁTICA</strong>
              <small>Último resultado há 12 min</small>
            </span>
          </div>
        }
      />
      <div className="standings-toolbar">
        <div className="filter-tabs">
          {(["ALL", 1, 2, 3] as const).map((item) => (
            <button
              key={item}
              onClick={() => setYear(item)}
              className={year === item ? "active" : ""}
            >
              {item === "ALL" ? "Geral" : `${item}º ano`}
            </button>
          ))}
        </div>
        <select
          aria-label="Modalidade"
          value={sport}
          onChange={(event) => setSport(event.target.value)}
        >
          <option value="">Todas as modalidades</option>
          {data.sports.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="standings-table-wrap">
        <table className="standings-table">
          <thead>
            <tr>
              <th>POS</th>
              <th>TURMA</th>
              <th>J</th>
              <th>V</th>
              <th>E</th>
              <th>D</th>
              <th>PF</th>
              <th>PS</th>
              <th>SG</th>
              <th>PTS</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, index) => (
              <tr key={row.id} className={index === 0 ? "first" : ""}>
                <td>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {index < 3 && <Medal size={14} />}
                </td>
                <td>
                  <TeamBadge team={row.name} small />
                  <strong>{row.name}</strong>
                </td>
                <td>{row.played}</td>
                <td>{row.won}</td>
                <td>{row.drawn}</td>
                <td>{row.lost}</td>
                <td>{row.scored}</td>
                <td>{row.conceded}</td>
                <td>
                  {row.difference > 0 ? `+${row.difference}` : row.difference}
                </td>
                <td>
                  <b>{row.points}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="table-note">
        Vitória = 3 pontos · Empate = 1 ponto · Desempate por saldo e pontos
        feitos
      </p>
    </>
  );
}

function SportsPage({
  data,
}: {
  data: ReturnType<typeof useChampionship>["data"];
}) {
  const sportNotes: Record<string, string> = {
    futsal: "Velocidade que muda tudo em poucos segundos.",
    volleyball: "Nenhum ponto se constrói sozinho.",
    basketball: "Decisão, espaço e precisão até o último segundo.",
  };
  return (
    <>
      <PageHeading
        kicker="CAMPEONATO"
        title="Modalidades"
        description="Três arenas. Uma só energia."
      />
      <div className="sports-editorial">
        {data.sports.map((sport, index) => {
          const games = data.matches.filter(
            (match) => match.sportId === sport.id,
          );
          const live = games.filter((match) => match.status === "LIVE").length;
          return (
            <Link
              href={`/app/agenda?modalidade=${sport.id}`}
              className="sport-row"
              key={sport.id}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{sport.name}</strong>
                <p>{sportNotes[sport.id]}</p>
              </div>
              <div className="sport-metrics">
                <p>
                  <strong>{games.length}</strong>
                  <span>jogos</span>
                </p>
                <p>
                  <strong>
                    {
                      games.filter((match) => match.status === "FINISHED")
                        .length
                    }
                  </strong>
                  <span>finalizados</span>
                </p>
                {live > 0 && (
                  <b>
                    <i /> AO VIVO
                  </b>
                )}
              </div>
              <ArrowRight />
            </Link>
          );
        })}
      </div>
    </>
  );
}

function MatchPage({
  matchId,
  data,
}: {
  matchId?: string;
  data: ReturnType<typeof useChampionship>["data"];
}) {
  const match = data.matches.find((item) => item.id === matchId);
  if (!match)
    return (
      <div className="empty-state">
        <CircleDot />
        <h2>Partida não encontrada.</h2>
        <Link href="/app/agenda">Voltar à agenda</Link>
      </div>
    );
  const events = data.events
    .filter((event) => event.matchId === match.id)
    .sort((a, b) => b.minute - a.minute);
  return (
    <>
      <PageHeading
        kicker={`${match.sport.toUpperCase()} / PARTIDA`}
        title={`${match.home} × ${match.away}`}
        description={`${formatGameDate(match.scheduledAt)} · ${match.venue}`}
        action={<StatusPill status={match.status} />}
      />
      <section className="match-detail-hero">
        <div className="match-detail-status">
          {match.status === "LIVE" && (
            <>
              <Radio size={14} /> ATUALIZAÇÃO AO VIVO · SINCRONIZADO
            </>
          )}
        </div>
        <div className="match-detail-score">
          <div>
            <TeamBadge team={match.home} />
            <strong>{match.home}</strong>
            <span>MANDANTE</span>
          </div>
          <div>
            <small>
              {match.sport.toUpperCase()} ·{" "}
              {match.status === "LIVE"
                ? `${match.period}º PERÍODO`
                : formatGameTime(match.scheduledAt)}
            </small>
            <b>
              {match.status === "SCHEDULED" ? (
                <i>VS</i>
              ) : (
                <>
                  {match.homeScore}
                  <i>:</i>
                  {match.awayScore}
                </>
              )}
            </b>
            {match.status === "LIVE" && (
              <em>
                {String(Math.floor(match.clockSeconds / 60)).padStart(2, "0")}:
                {String(match.clockSeconds % 60).padStart(2, "0")}
              </em>
            )}
          </div>
          <div>
            <TeamBadge team={match.away} />
            <strong>{match.away}</strong>
            <span>VISITANTE</span>
          </div>
        </div>
        <div className="match-detail-meta">
          <span>
            <CalendarDays size={14} />
            {formatGameDate(match.scheduledAt)} ·{" "}
            {formatGameTime(match.scheduledAt)}
          </span>
          <span>
            <MapPin size={14} />
            {match.venue}
          </span>
          <span>
            <Shield size={14} />
            {match.referee || "Árbitro a definir"}
          </span>
        </div>
      </section>
      <section className="match-detail-grid">
        <div className="event-timeline">
          <div className="section-head">
            <div>
              <p>LANCE A LANCE</p>
              <h2>Eventos da partida</h2>
            </div>
          </div>
          {events.length ? (
            events.map((event) => (
              <div className="timeline-event" key={event.id}>
                <span>{event.minute}&apos;</span>
                <i className={event.value > 0 ? "score" : "card"} />
                <div>
                  <strong>{event.type}</strong>
                  <small>
                    {event.side === "HOME"
                      ? match.home
                      : event.side === "AWAY"
                        ? match.away
                        : "Partida"}
                  </small>
                </div>
                {event.value > 0 && <b>+{event.value}</b>}
              </div>
            ))
          ) : (
            <div className="empty-inline">
              Os eventos aparecerão aqui quando a partida começar.
            </div>
          )}
        </div>
        <div className="match-facts">
          <div className="section-head">
            <div>
              <p>DETALHES</p>
              <h2>Informações</h2>
            </div>
          </div>
          <dl>
            <div>
              <dt>Modalidade</dt>
              <dd>{match.sport}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{statusLabels[match.status]}</dd>
            </div>
            <div>
              <dt>Local</dt>
              <dd>{match.venue}</dd>
            </div>
            <div>
              <dt>Árbitro</dt>
              <dd>{match.referee || "A definir"}</dd>
            </div>
            <div>
              <dt>Última atualização</dt>
              <dd>Agora</dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  );
}

function RefereePage({
  user,
  data,
  refresh,
}: {
  user: User;
  data: ReturnType<typeof useChampionship>["data"];
  refresh: () => Promise<void>;
}) {
  const assigned = data.matches.filter((match) => match.refereeId === user.id);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function createMatch(values: Record<string, string>) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, action: "createMatch" }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(result.error || "Não foi possível criar a partida.");
        return false;
      }
      await refresh();
      setMessage("Partida criada e atribuída a você.");
      return true;
    } catch {
      setMessage("Sem conexão. Confira a internet e tente novamente.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeading
        kicker="PAINEL DO ÁRBITRO"
        title="Meus jogos"
        description="Apenas as partidas atribuídas a você."
        action={
          <div className="referee-ready">
            <span />
            <div>
              <strong>DISPOSITIVO PRONTO</strong>
              <small>Atualização conectada</small>
            </div>
          </div>
        }
      />
      <div className="referee-alert">
        <ShieldCheck size={19} />
        <div>
          <strong>Olá, {user.firstName}.</strong>
          <span>
            Você tem{" "}
            {assigned.filter((match) => match.status !== "FINISHED").length}{" "}
            partidas pendentes. Os controles são liberados somente nos seus
            jogos.
          </span>
        </div>
      </div>
      <section className="referee-create">
        <MatchCreationForm
          classes={data.classes}
          sports={data.sports}
          onCreate={createMatch}
          busy={busy}
          buttonLabel="CRIAR E ATRIBUIR A MIM"
        />
        {message && (
          <p className="referee-message" role="status">
            {message}
          </p>
        )}
      </section>
      <div className="referee-games">
        {assigned.map((match) => (
          <article
            key={match.id}
            className={match.status === "LIVE" ? "live" : ""}
          >
            <div className="ref-game-top">
              <StatusPill status={match.status} />
              <span>
                {formatGameDate(match.scheduledAt)} ·{" "}
                {formatGameTime(match.scheduledAt)}
              </span>
            </div>
            <div className="ref-game-score">
              <div>
                <TeamBadge team={match.home} />
                <strong>{match.home}</strong>
              </div>
              <b>
                {match.status === "SCHEDULED"
                  ? "VS"
                  : `${match.homeScore} : ${match.awayScore}`}
              </b>
              <div>
                <TeamBadge team={match.away} />
                <strong>{match.away}</strong>
              </div>
            </div>
            <div className="ref-game-meta">
              <span>
                <CircleDot size={13} />
                {match.sport}
              </span>
              <span>
                <MapPin size={13} />
                {match.venue}
              </span>
            </div>
            {match.status !== "FINISHED" && match.status !== "CANCELLED" ? (
              <Link className="control-button" href={`/arbitragem/${match.id}`}>
                {match.status === "LIVE"
                  ? "CONTINUAR PARTIDA"
                  : "CONTROLAR PARTIDA"}
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link
                className="review-button"
                href={`/app/partidas/${match.id}`}
              >
                Ver súmula <ArrowRight size={14} />
              </Link>
            )}
          </article>
        ))}
      </div>
    </>
  );
}

function AdminPage({
  data,
  refresh,
}: {
  data: ReturnType<typeof useChampionship>["data"];
  refresh: () => Promise<void>;
}) {
  const [section, setSection] = useState("overview");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function post(body: Record<string, string>) {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setMessage(result.error || "Não foi possível salvar.");
      return false;
    }
    await refresh();
    setMessage("Alteração salva com sucesso.");
    return true;
  }
  const adminSections = [
    ["overview", "Visão geral"],
    ["games", "Jogos"],
    ["classes", "Turmas"],
    ["sports", "Modalidades"],
    ["referees", "Árbitros"],
    ["users", "Usuários"],
    ["settings", "Configurações"],
  ];
  return (
    <>
      <PageHeading
        kicker="GESTÃO DO CAMPEONATO"
        title="Administração"
        description="Controle seguro de jogos, pessoas e modalidades."
        action={
          <button className="primary-dark" onClick={() => setSection("games")}>
            <Plus size={15} /> Novo jogo
          </button>
        }
      />
      <div className="admin-tabs">
        {adminSections.map(([id, label]) => (
          <button
            key={id}
            className={section === id ? "active" : ""}
            onClick={() => setSection(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {message && <div className="admin-message">{message}</div>}
      {section === "overview" && (
        <>
          <section className="admin-robot-card">
            <div className="admin-robot-copy">
              <p>ASSISTENTE DE GESTÃO</p>
              <h2>
                O campeonato inteiro
                <br />
                sob seu comando.
              </h2>
              <span>
                Acompanhe partidas, turmas e arbitragem em uma central viva e
                interativa.
              </span>
              <button type="button" onClick={() => setSection("games")}>
                GERENCIAR JOGOS <ArrowRight size={15} />
              </button>
            </div>
            <div className="admin-robot-stage">
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                label="Robô 3D interativo da central de gestão"
              />
            </div>
          </section>
          <div className="admin-metrics">
            <div>
              <span>JOGOS</span>
              <strong>{data.matches.length}</strong>
              <small>
                {data.matches.filter((m) => m.status === "SCHEDULED").length}{" "}
                agendados
              </small>
            </div>
            <div>
              <span>AO VIVO</span>
              <strong>
                {data.matches.filter((m) => m.status === "LIVE").length}
              </strong>
              <small>placares sincronizados</small>
            </div>
            <div>
              <span>USUÁRIOS</span>
              <strong>{data.users.length}</strong>
              <small>
                {data.users.filter((u) => u.role === "REFEREE").length}{" "}
                árbitro(s)
              </small>
            </div>
            <div>
              <span>MODALIDADES</span>
              <strong>{data.sports.length}</strong>
              <small>todas ativas</small>
            </div>
          </div>
          <div className="admin-overview-grid">
            <div className="admin-panel">
              <div className="section-head">
                <div>
                  <p>OPERAÇÃO</p>
                  <h2>Jogos recentes</h2>
                </div>
                <button onClick={() => setSection("games")}>
                  Gerenciar <ArrowRight size={13} />
                </button>
              </div>
              <div className="admin-match-list">
                {data.matches.slice(0, 5).map((m) => (
                  <div key={m.id}>
                    <StatusPill status={m.status} />
                    <strong>
                      {m.home}{" "}
                      <i>
                        {m.status === "SCHEDULED"
                          ? "VS"
                          : `${m.homeScore} : ${m.awayScore}`}
                      </i>{" "}
                      {m.away}
                    </strong>
                    <span>
                      {m.sport} · {formatGameTime(m.scheduledAt)}
                    </span>
                    <Link href={`/app/partidas/${m.id}`}>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-panel health-panel">
              <div className="section-head">
                <div>
                  <p>SISTEMA</p>
                  <h2>Saúde da operação</h2>
                </div>
              </div>
              <div className="health-row">
                <span>
                  <i />
                  Banco de dados
                </span>
                <b>Operacional</b>
              </div>
              <div className="health-row">
                <span>
                  <i />
                  Atualizações ao vivo
                </span>
                <b>Conectado</b>
              </div>
              <div className="health-row">
                <span>
                  <i />
                  Controle de acesso
                </span>
                <b>RBAC ativo</b>
              </div>
              <div className="admin-security">
                <ShieldCheck />
                <p>
                  <strong>Permissões no servidor</strong>
                  <span>Placar protegido por atribuição de árbitro.</span>
                </p>
              </div>
            </div>
          </div>
        </>
      )}
      {section === "games" && (
        <div className="admin-workspace">
          <MatchCreationForm
            classes={data.classes}
            sports={data.sports}
            referees={data.users.filter((user) => user.role === "REFEREE")}
            onCreate={(values) => post({ ...values, action: "createMatch" })}
            busy={busy}
          />
          <div className="admin-panel">
            <div className="section-head">
              <div>
                <p>CALENDÁRIO</p>
                <h2>Todos os jogos</h2>
              </div>
            </div>
            <div className="admin-match-list large">
              {data.matches.map((m) => (
                <div key={m.id}>
                  <StatusPill status={m.status} />
                  <strong>
                    {m.home}{" "}
                    <i>
                      {m.status === "SCHEDULED"
                        ? "VS"
                        : `${m.homeScore} : ${m.awayScore}`}
                    </i>{" "}
                    {m.away}
                  </strong>
                  <span>
                    {formatGameDate(m.scheduledAt)} ·{" "}
                    {formatGameTime(m.scheduledAt)} · {m.sport}
                  </span>
                  {m.status !== "CANCELLED" && m.status !== "FINISHED" ? (
                    <button
                      aria-label="Cancelar jogo"
                      onClick={() =>
                        void post({ action: "cancelMatch", matchId: m.id })
                      }
                    >
                      <X size={14} />
                    </button>
                  ) : (
                    <Link href={`/app/partidas/${m.id}`}>
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {(section === "users" || section === "referees") && (
        <div className="admin-panel">
          <div className="section-head">
            <div>
              <p>ACESSOS</p>
              <h2>{section === "referees" ? "Árbitros" : "Usuários"}</h2>
            </div>
          </div>
          <div className="users-table">
            <div className="users-head">
              <span>PESSOA</span>
              <span>TURMA</span>
              <span>FUNÇÃO</span>
              <span>ACESSO</span>
            </div>
            {data.users
              .filter(
                (u) =>
                  section !== "referees" ||
                  u.role === "REFEREE" ||
                  u.requestedRole === "REFEREE",
              )
              .map((u) => (
                <div key={u.id}>
                  <div className="user-cell">
                    <span>{initials(`${u.firstName} ${u.lastName}`)}</span>
                    <p>
                      <strong>
                        {u.firstName} {u.lastName}
                      </strong>
                      <small>{u.email}</small>
                      {u.requestedRole && u.requestedRole !== u.role && (
                        <small>
                          Solicitou:{" "}
                          {u.requestedRole === "REFEREE" ? "árbitro" : "gestão"}
                        </small>
                      )}
                    </p>
                  </div>
                  <span>
                    {u.classId ? `${u.classId[0]}º ${u.classId[1]}` : "—"}
                  </span>
                  <select
                    value={u.role}
                    onChange={(e) =>
                      void post({
                        action: "setRole",
                        userId: u.id,
                        role: e.target.value,
                      })
                    }
                  >
                    <option value="STUDENT">Aluno</option>
                    <option value="REFEREE">Árbitro</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <b>Ativo</b>
                </div>
              ))}
          </div>
        </div>
      )}
      {section === "classes" && (
        <div className="class-admin-grid">
          {[1, 2, 3].map((year) => (
            <div className="admin-panel" key={year}>
              <p>{year}º ANO</p>
              <h2>{year}º ano</h2>
              {data.classes
                .filter((c) => c.year === year)
                .map((c) => (
                  <div className="class-admin-row" key={c.id}>
                    <TeamBadge team={c.name} />
                    <strong>{c.name}</strong>
                    <span>
                      {data.users.filter((u) => u.classId === c.id).length}{" "}
                      alunos
                    </span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
      {section === "sports" && <SportsPage data={data} />}{" "}
      {section === "settings" && (
        <div className="admin-panel settings-panel">
          <div className="section-head">
            <div>
              <p>CONFIGURAÇÕES</p>
              <h2>Campeonato</h2>
            </div>
          </div>
          <label>
            Nome da edição
            <input defaultValue="Interclasse LGF 2026" />
          </label>
          <label>
            Ano letivo
            <input defaultValue="2026" />
          </label>
          <label className="toggle-row">
            <span>
              <strong>Atualizações ao vivo</strong>
              <small>Sincronizar placares automaticamente</small>
            </span>
            <input
              aria-label="Ativar atualizações ao vivo"
              type="checkbox"
              defaultChecked
            />
          </label>
          <label className="toggle-row">
            <span>
              <strong>Cadastro de alunos</strong>
              <small>Permitir novas contas</small>
            </span>
            <input
              aria-label="Ativar cadastro de alunos"
              type="checkbox"
              defaultChecked
            />
          </label>
          <button className="primary-dark">Salvar configurações</button>
        </div>
      )}
    </>
  );
}

export function AppShell({
  page,
  matchId,
}: {
  page: SystemPage;
  matchId?: string;
}) {
  const {
    data,
    loading: dataLoading,
    error,
    refresh,
  } = useChampionship(page === "match" || page === "referee");
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          window.location.href = "/entrar";
          return;
        }
        const result = (await response.json()) as { user: User };
        setUser(result.user);
      })
      .finally(() => setAuthLoading(false));
  }, []);
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/entrar";
  }
  if (authLoading || dataLoading || !user)
    return (
      <div className="app-loading">
        <div className="brand-mark">
          <Image src="/logo-escola.png" alt="" width={52} height={52} />
        </div>
        <span />
        <p>CARREGANDO CAMPEONATO</p>
      </div>
    );
  if (
    (page === "admin" && user.role !== "ADMIN") ||
    (page === "referee" && !["REFEREE", "ADMIN"].includes(user.role))
  )
    return (
      <div className="access-denied">
        <Shield size={42} />
        <h1>Acesso restrito.</h1>
        <p>Seu perfil não tem permissão para esta área.</p>
        <Link href="/app">Voltar ao início</Link>
      </div>
    );
  const standings = calculateStandings(data);
  const title = {
    dashboard: "Início",
    agenda: "Jogos",
    standings: "Classificação",
    sports: "Modalidades",
    profile: "Perfil",
    match: "Partida",
    referee: "Arbitragem",
    admin: "Administração",
  }[page];
  return (
    <main className="app-shell">
      <Sidebar
        user={user}
        active={page}
        open={menuOpen}
        close={() => setMenuOpen(false)}
      />
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-label="Fechar menu"
        />
      )}
      <section className="app-workspace">
        <AppTopbar
          title={title}
          menu={() => setMenuOpen(true)}
          live={
            page === "match" || data.matches.some((m) => m.status === "LIVE")
          }
        />
        <div className="app-content">
          {error && <div className="data-error">{error}</div>}
          {page === "dashboard" && (
            <DashboardPage
              user={user}
              matches={data.matches}
              standings={standings}
            />
          )}{" "}
          {page === "agenda" && <AgendaPage matches={data.matches} />}{" "}
          {page === "standings" && <StandingsPage data={data} />}{" "}
          {page === "sports" && <SportsPage data={data} />}{" "}
          {page === "profile" && (
            <ProfileEditor
              user={user}
              data={data}
              onUpdate={setUser}
              logout={logout}
            />
          )}{" "}
          {page === "match" && <MatchPage matchId={matchId} data={data} />}{" "}
          {page === "referee" && (
            <RefereePage user={user} data={data} refresh={refresh} />
          )}{" "}
          {page === "admin" && <AdminPage data={data} refresh={refresh} />}
        </div>
      </section>
      <nav className="mobile-bottom-nav">
        {navItems.slice(0, 5).map((item) => (
          <Link
            href={item.href}
            className={page === item.page ? "active" : ""}
            key={item.page}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
