"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Clock3,
  Pause,
  Play,
  Plus,
  Radio,
  RotateCcw,
  ShieldCheck,
  Square,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useChampionship } from "../data/useChampionship";
import type { User } from "../../lib/types";

function formatClock(seconds: number) {
  return (
    String(Math.floor(seconds / 60)).padStart(2, "0") +
    ":" +
    String(seconds % 60).padStart(2, "0")
  );
}

export function ControlCenter({ matchId }: { matchId: string }) {
  const { data, loading, refresh } = useChampionship(true);
  const [user, setUser] = useState<User | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("Tudo sincronizado");
  const match = useMemo(
    () => data.matches.find((item) => item.id === matchId),
    [data.matches, matchId],
  );

  useEffect(() => {
    fetch("/api/auth/me").then(async (response) => {
      if (!response.ok) {
        window.location.href = "/entrar";
        return;
      }
      setUser(((await response.json()) as { user: User }).user);
    });
  }, []);
  useEffect(() => {
    if (!match || match.clockRunning) return;
    const timer = window.setTimeout(() => setElapsed(match.clockSeconds), 0);
    return () => window.clearTimeout(timer);
  }, [match]);
  useEffect(() => {
    if (!match?.clockRunning) return;
    const started = Date.now();
    const base = match.clockSeconds;
    const interval = window.setInterval(
      () => setElapsed(base + Math.floor((Date.now() - started) / 1000)),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [match?.clockRunning, match?.clockSeconds]);

  async function control(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action);
    setNotice("Salvando...");
    const response = await fetch("/api/matches/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId,
        action,
        clockSeconds: elapsed,
        ...extra,
      }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setNotice(result.error || "Falha ao salvar");
      setBusy("");
      return;
    }
    await refresh();
    setNotice("Tudo sincronizado");
    setBusy("");
  }

  if (loading || !match || !user)
    return (
      <div className="control-loading">
        <div className="brand-mark">
          <Image src="/logo-escola.png" alt="" width={48} height={48} />
        </div>
        <span />
        <p>PREPARANDO A PARTIDA</p>
      </div>
    );
  const authorized =
    user.role === "ADMIN" ||
    (user.role === "REFEREE" && match.refereeId === user.id);
  if (!authorized)
    return (
      <div className="access-denied control-denied">
        <ShieldCheck size={44} />
        <h1>Partida não atribuída.</h1>
        <p>
          Somente o árbitro escalado e a administração podem alterar este
          placar.
        </p>
        <Link href="/arbitragem">Voltar aos meus jogos</Link>
      </div>
    );

  const basketball = match.sportId === "basketball";
  const volleyball = match.sportId === "volleyball";
  const scoreOptions = basketball ? [1, 2, 3] : [1];
  const events = volleyball
    ? ["Timeout", "Fim do set"]
    : basketball
      ? ["Falta", "Timeout", "Fim do período"]
      : ["Cartão amarelo", "Cartão vermelho", "Falta", "Acréscimo"];
  const sideName = (side: "HOME" | "AWAY") =>
    side === "HOME" ? match.home : match.away;

  return (
    <main className="control-shell">
      <header className="control-header">
        <Link href="/arbitragem">
          <ArrowLeft size={17} /> Meus jogos
        </Link>
        <div className="control-brand">
          <Image src="/logo-escola.png" alt="LGF" width={38} height={38} />
          <span>
            <strong>CENTRAL DA PARTIDA</strong>
            <small>
              {match.sport.toUpperCase()} · {match.venue.toUpperCase()}
            </small>
          </span>
        </div>
        <div className="sync-status">
          <i className={notice === "Tudo sincronizado" ? "ok" : ""} />
          <span>{notice}</span>
        </div>
      </header>
      <section className="control-main">
        <div className="control-context">
          <span className="live-control">
            <Radio size={13} />{" "}
            {match.status === "LIVE"
              ? "PARTIDA EM ANDAMENTO"
              : "PRONTA PARA INICIAR"}
          </span>
          <span>{match.period}º PERÍODO</span>
        </div>
        <div className="control-scoreboard">
          <div className="control-team">
            <span>{match.home.slice(0, -1)}</span>
            <strong>{match.home.slice(-1)}</strong>
            <small>ESQUERDA</small>
          </div>
          <div className="control-score">
            <b>{match.homeScore}</b>
            <i>:</i>
            <b>{match.awayScore}</b>
            <div className="control-clock">
              <Clock3 size={15} />
              <span>{formatClock(elapsed)}</span>
            </div>
          </div>
          <div className="control-team">
            <span>{match.away.slice(0, -1)}</span>
            <strong>{match.away.slice(-1)}</strong>
            <small>DIREITA</small>
          </div>
        </div>

        <div className="score-controls">
          {(["HOME", "AWAY"] as const).map((side) => (
            <div className="side-controls" key={side}>
              <p>{sideName(side).toUpperCase()}</p>
              {scoreOptions.map((value) => (
                <button
                  className="score-button"
                  disabled={!!busy || match.status === "FINISHED"}
                  onClick={() =>
                    void control("score", {
                      side,
                      value,
                      type: basketball
                        ? "+" + value
                        : volleyball
                          ? "Ponto"
                          : "Gol",
                    })
                  }
                  key={value}
                >
                  <Plus size={24} />
                  <span>
                    {basketball
                      ? "+" + value + " PONTOS"
                      : volleyball
                        ? "PONTO"
                        : "GOL"}
                  </span>
                  <small>{side === "HOME" ? "ESQUERDA" : "DIREITA"}</small>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="match-actions">
          <button onClick={() => void control("undo")} disabled={!!busy}>
            <RotateCcw size={18} />
            <span>DESFAZER</span>
          </button>
          {match.status === "SCHEDULED" ? (
            <button
              className="play-action"
              onClick={() => void control("start")}
              disabled={!!busy}
            >
              <Play size={19} />
              <span>INICIAR</span>
            </button>
          ) : (
            <button
              className={match.clockRunning ? "pause-action" : "play-action"}
              onClick={() => void control("toggleClock")}
              disabled={!!busy || match.status === "FINISHED"}
            >
              {match.clockRunning ? <Pause size={19} /> : <Play size={19} />}
              <span>{match.clockRunning ? "PAUSAR" : "RETOMAR"}</span>
            </button>
          )}
          <button
            className="finish-action"
            onClick={() => {
              if (
                window.confirm(
                  "Finalizar a partida? O resultado passará a valer na classificação.",
                )
              )
                void control("finish");
            }}
            disabled={!!busy || match.status === "FINISHED"}
          >
            <Square size={17} />
            <span>FINALIZAR</span>
          </button>
        </div>

        <section className="quick-events">
          <div>
            <p>EVENTOS RÁPIDOS</p>
            <span>Registre sem alterar o placar</span>
          </div>
          <div className="event-controls">
            {events.map((event) => (
              <div className="event-pair" key={event}>
                <span>{event.toUpperCase()}</span>
                <button
                  onClick={() =>
                    void control("event", { side: "HOME", type: event })
                  }
                >
                  {match.home}
                </button>
                <button
                  onClick={() =>
                    void control("event", { side: "AWAY", type: event })
                  }
                >
                  {match.away}
                </button>
              </div>
            ))}
          </div>
        </section>
        <div className="control-tip">
          <CircleAlert size={17} />
          <p>
            <strong>Persistência protegida.</strong> O cronômetro é salvo a cada
            evento, pausa e alteração de placar. Recarregar a tela não apaga o
            estado importante.
          </p>
        </div>
      </section>
      <footer className="control-footer">
        <span>
          <ShieldCheck size={14} /> ACESSO: {user.firstName.toUpperCase()}{" "}
          {user.lastName.toUpperCase()}
        </span>
        <span>
          <Check size={14} /> ALTERAÇÕES AUTORIZADAS PELO SERVIDOR
        </span>
      </footer>
    </main>
  );
}
