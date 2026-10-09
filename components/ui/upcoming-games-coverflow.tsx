"use client";

import * as React from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
} from "lucide-react";
import type { ChampionshipData, Match } from "../../lib/types";
import { formatGameDate, formatGameTime } from "../../lib/types";

const FALLBACK_GAMES: Match[] = [
  {
    id: "match-002",
    sportId: "volleyball",
    sport: "Vôlei",
    scoreLabel: "Ponto",
    homeId: "1B",
    home: "1º B",
    awayId: "1C",
    away: "1º C",
    scheduledAt: "2026-08-20T15:20:00-03:00",
    venue: "Quadra principal",
    status: "SCHEDULED",
    homeScore: 0,
    awayScore: 0,
    refereeId: null,
    referee: null,
    period: 1,
    clockSeconds: 0,
    clockRunning: false,
    version: 1,
    updatedAt: "",
  },
  {
    id: "match-003",
    sportId: "basketball",
    sport: "Basquete",
    scoreLabel: "Ponto",
    homeId: "3B",
    home: "3º B",
    awayId: "2A",
    away: "2º A",
    scheduledAt: "2026-08-20T16:10:00-03:00",
    venue: "Ginásio",
    status: "SCHEDULED",
    homeScore: 0,
    awayScore: 0,
    refereeId: null,
    referee: null,
    period: 1,
    clockSeconds: 0,
    clockRunning: false,
    version: 1,
    updatedAt: "",
  },
  {
    id: "match-live",
    sportId: "futsal",
    sport: "Futsal",
    scoreLabel: "Gol",
    homeId: "3A",
    home: "3º A",
    awayId: "2B",
    away: "2º B",
    scheduledAt: "2026-08-20T14:30:00-03:00",
    venue: "Quadra principal",
    status: "SCHEDULED",
    homeScore: 0,
    awayScore: 0,
    refereeId: null,
    referee: null,
    period: 1,
    clockSeconds: 0,
    clockRunning: false,
    version: 1,
    updatedAt: "",
  },
];

const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function UpcomingGamesCoverflow() {
  const [games, setGames] = React.useState<Match[]>(FALLBACK_GAMES);
  const [selected, setSelected] = React.useState(0);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const frameRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const posRef = React.useRef(0);
  const targetRef = React.useRef(0);
  const widthRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  const dragRef = React.useRef<{
    id: number;
    x: number;
    pos: number;
    v: number;
    t: number;
  } | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/data", { cache: "no-store", signal: controller.signal })
      .then((response) =>
        response.ok ? (response.json() as Promise<ChampionshipData>) : null,
      )
      .then((data) => {
        const scheduled = data?.matches
          .filter(
            (match) =>
              match.status === "SCHEDULED" && match.sportId !== "football",
          )
          .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))
          .slice(0, 5);
        if (scheduled?.length) setGames(scheduled);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          console.error("Não foi possível atualizar os próximos jogos.", error);
      });
    return () => controller.abort();
  }, []);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const count = games.length;
  const indexAt = React.useCallback(
    (position: number) => ((Math.round(position) % count) + count) % count,
    [count],
  );

  const paint = React.useCallback(() => {
    const width = widthRef.current;
    if (!width || count === 0) return;
    const pitch = width * 0.74;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      let offset = index - posRef.current;
      offset = ((offset % count) + count) % count;
      if (offset > count / 2) offset -= count;

      const distance = Math.abs(offset);
      const ramp = Math.pow(distance, 0.56);
      const tilt = reducedMotion
        ? 0
        : Math.min(42 * ramp, 78) * Math.sign(offset);
      const depth = reducedMotion ? 0 : -0.58 * width * ramp;
      card.style.transform = `translateX(calc(-50% + ${offset * pitch}px)) translateZ(${depth}px) rotateY(${-tilt}deg)`;
      card.style.opacity = String(Math.max(0, 1 - 0.18 * distance));
      card.style.zIndex = String(100 - Math.round(distance));
    });
  }, [count, reducedMotion]);

  const settle = React.useCallback(
    (target: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      targetRef.current = target;
      setSelected(indexAt(target));

      if (reducedMotion) {
        posRef.current = target;
        paint();
        rafRef.current = null;
        return;
      }

      const step = () => {
        const remaining = target - posRef.current;
        if (Math.abs(remaining) < 0.0004) {
          posRef.current = target;
          paint();
          rafRef.current = null;
          return;
        }
        posRef.current += remaining * 0.16;
        paint();
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [indexAt, paint, reducedMotion],
  );

  const nudge = React.useCallback(
    (by: number) => settle(Math.round(targetRef.current) + by),
    [settle],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    event.currentTarget.setPointerCapture(event.pointerId);
    targetRef.current = posRef.current;
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      pos: posRef.current,
      v: 0,
      t: performance.now(),
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const pitch = widthRef.current * 0.74;
    if (!pitch) return;
    const now = performance.now();
    const previous = posRef.current;
    posRef.current = drag.pos - (event.clientX - drag.x) / pitch;
    drag.v = ((posRef.current - previous) / Math.max(now - drag.t, 1)) * 1000;
    drag.t = now;
    setSelected(indexAt(posRef.current));
    paint();
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    const carried = reducedMotion
      ? 0
      : Math.max(-2, Math.min(2, drag.v * 0.18));
    settle(Math.round(posRef.current + carried));
  };

  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      const card = cardRefs.current[0];
      if (!card) return;
      widthRef.current = card.offsetWidth;
      paint();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [paint]);

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return (
    <div
      className="games-coverflow"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Próximos jogos do Interclasse"
    >
      <div
        ref={frameRef}
        className="games-coverflow-frame"
        role="slider"
        aria-label="Selecionar jogo"
        aria-orientation="horizontal"
        aria-valuemin={1}
        aria-valuemax={count}
        aria-valuenow={selected + 1}
        aria-valuetext={`${games[selected]?.home ?? ""} contra ${games[selected]?.away ?? ""}`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            nudge(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            nudge(1);
          }
        }}
      >
        <div className="games-coverflow-track">
          {games.map((game, index) => (
            <div
              key={game.id}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              className={`game-cover-card ${index === selected ? "is-active" : ""}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${count}: ${game.home} contra ${game.away}`}
            >
              <div className="game-cover-top">
                <span>{game.sport.toUpperCase()}</span>
                <b>AGENDADO</b>
              </div>
              <div className="game-cover-date">
                <CalendarDays size={15} />
                <span>{formatGameDate(game.scheduledAt)}</span>
              </div>
              <div className="game-cover-versus">
                <strong>{game.home}</strong>
                <i>VS</i>
                <strong>{game.away}</strong>
              </div>
              <div className="game-cover-meta">
                <span>
                  <Clock3 size={14} />
                  {formatGameTime(game.scheduledAt)}
                </span>
                <span>
                  <MapPin size={14} />
                  {game.venue}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        className="coverflow-nav previous"
        type="button"
        aria-label="Jogo anterior"
        onClick={() => nudge(-1)}
      >
        <ChevronLeft size={19} />
      </button>
      <button
        className="coverflow-nav next"
        type="button"
        aria-label="Próximo jogo"
        onClick={() => nudge(1)}
      >
        <ChevronRight size={19} />
      </button>
      <div className="coverflow-pagination" aria-hidden="true">
        {games.map((game, index) => (
          <span className={index === selected ? "active" : ""} key={game.id} />
        ))}
      </div>
    </div>
  );
}
