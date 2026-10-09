"use client";

import Link from "next/link";
import { ArrowRight, Camera, LogOut, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import {
  calculateStandings,
  formatGameDate,
  formatGameTime,
  type ChampionshipData,
  type User,
} from "../../lib/types";

const roleLabel: Record<User["role"], string> = {
  STUDENT: "Aluno",
  REFEREE: "Árbitro",
  ADMIN: "Administrador",
};

export function ProfileEditor({
  user,
  data,
  onUpdate,
  logout,
}: {
  user: User;
  data: ChampionshipData;
  onUpdate: (user: User) => void;
  logout: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [photoVersion, setPhotoVersion] = useState(0);
  const standings = calculateStandings(data);
  const own = standings.find((row) => row.id === user.classId);
  const position = standings.findIndex((row) => row.id === user.classId);
  const matches = data.matches
    .filter(
      (match) =>
        user.classId && [match.homeId, match.awayId].includes(user.classId),
    )
    .slice(0, 3);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const values = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as { user?: User; error?: string };
      if (!response.ok || !result.user)
        throw new Error(result.error || "Não foi possível salvar seu perfil.");
      onUpdate(result.user);
      setEditing(false);
      setMessage("Perfil atualizado.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar seu perfil.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const body = new FormData();
      body.append("photo", file);
      const response = await fetch("/api/profile/photo", {
        method: "POST",
        body,
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error || "Não foi possível enviar a foto.");
      onUpdate({ ...user, avatar: `avatars/${user.id}` });
      setPhotoVersion((version) => version + 1);
      setMessage("Foto atualizada.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a foto.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/profile/photo", { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error || "Não foi possível remover a foto.");
      onUpdate({ ...user, avatar: null });
      setMessage("Foto removida.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível remover a foto.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p>CONTA</p>
          <h1>Seu perfil</h1>
          <span>Seus dados, sua foto e sua turma no Interclasse.</span>
        </div>
      </div>
      <section className="profile-layout">
        <div className="profile-card">
          <label
            className="profile-avatar profile-avatar-edit"
            aria-label="Adicionar foto de perfil"
          >
            {user.avatar ? (
              <img
                src={`/api/profile/photo?v=${photoVersion}`}
                alt={`Foto de ${user.firstName}`}
              />
            ) : (
              <span>
                {`${user.firstName[0]}${user.lastName[0]}`.toUpperCase()}
              </span>
            )}
            <span className="profile-photo-action">
              <Camera size={15} />
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={(event) => void upload(event.target.files?.[0])}
            />
          </label>
          <p className="profile-photo-hint">JPG, PNG ou WebP · até 2 MB</p>
          {user.avatar && (
            <button
              type="button"
              className="profile-remove-photo"
              disabled={busy}
              onClick={() => void removePhoto()}
            >
              Remover foto
            </button>
          )}
          <h2>
            {user.firstName} {user.lastName}
          </h2>
          <p>@{user.username}</p>
          <span className="profile-role">
            <ShieldCheck size={14} />
            {roleLabel[user.role]}
          </span>
          {user.requestedRole && user.requestedRole !== user.role && (
            <p className="profile-pending">
              Pedido de {roleLabel[user.requestedRole].toLowerCase()} aguardando
              aprovação
            </p>
          )}
          {user.classId && (
            <div className="profile-team">
              <span className="team-badge small">
                <i>{user.classId[0]}º</i>
                <strong>{user.classId[1]}</strong>
              </span>
              <div>
                <small>TURMA / EQUIPE</small>
                <strong>
                  {user.classId[0]}º {user.classId[1]}
                </strong>
              </div>
            </div>
          )}
          <button type="button" className="logout-button" onClick={logout}>
            <LogOut size={15} /> Sair do sistema
          </button>
        </div>
        <div className="profile-main">
          {user.classId && (
            <div className="profile-stats">
              <div>
                <span>JOGOS</span>
                <strong>{own?.played ?? 0}</strong>
              </div>
              <div>
                <span>VITÓRIAS</span>
                <strong>{own?.won ?? 0}</strong>
              </div>
              <div>
                <span>PONTOS</span>
                <strong>{own?.points ?? 0}</strong>
              </div>
              <div>
                <span>POSIÇÃO</span>
                <strong>{position >= 0 ? `#${position + 1}` : "—"}</strong>
              </div>
            </div>
          )}
          <div className="profile-info">
            <div className="section-head">
              <div>
                <p>DADOS PESSOAIS</p>
                <h2>Informações básicas</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditing((value) => !value);
                  setMessage("");
                }}
              >
                {editing ? "Cancelar" : "Editar"}
              </button>
            </div>
            {message && (
              <p className="profile-message" role="status">
                {message}
              </p>
            )}
            {editing ? (
              <form className="profile-edit-form" onSubmit={save}>
                <label>
                  Nome
                  <input
                    name="firstName"
                    defaultValue={user.firstName}
                    minLength={2}
                    maxLength={60}
                    required
                  />
                </label>
                <label>
                  Sobrenome
                  <input
                    name="lastName"
                    defaultValue={user.lastName}
                    minLength={2}
                    maxLength={60}
                    required
                  />
                </label>
                <label>
                  Turma / equipe
                  <select
                    name="classId"
                    defaultValue={user.classId || ""}
                    required={
                      user.role === "STUDENT" &&
                      user.requestedRole === "STUDENT"
                    }
                  >
                    <option value="">Sem turma</option>
                    {data.classes.map((team) => (
                      <option value={team.id} key={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="submit-button" type="submit" disabled={busy}>
                  {busy ? "SALVANDO..." : "SALVAR PERFIL"}
                  <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <div className="info-grid">
                <div>
                  Nome completo
                  <strong>
                    {user.firstName} {user.lastName}
                  </strong>
                </div>
                <div>
                  Usuário<strong>@{user.username}</strong>
                </div>
                <div>
                  E-mail<strong>{user.email}</strong>
                </div>
                <div>
                  Turma / equipe
                  <strong>
                    {user.classId
                      ? `${user.classId[0]}º ${user.classId[1]}`
                      : "Não definida"}
                  </strong>
                </div>
              </div>
            )}
          </div>
          {user.classId && (
            <div className="profile-games">
              <div className="section-head">
                <div>
                  <p>SUA TURMA</p>
                  <h2>Jogos relacionados</h2>
                </div>
              </div>
              <div className="mini-game-list">
                {matches.length ? (
                  matches.map((match) => (
                    <Link key={match.id} href={`/app/partidas/${match.id}`}>
                      <span>{match.sport}</span>
                      <span>{match.home}</span>
                      <b>
                        {match.status === "SCHEDULED"
                          ? "VS"
                          : `${match.homeScore} : ${match.awayScore}`}
                      </b>
                      <span>{match.away}</span>
                      <small>
                        {formatGameDate(match.scheduledAt)} ·{" "}
                        {formatGameTime(match.scheduledAt)}
                      </small>
                      <ArrowRight size={14} />
                    </Link>
                  ))
                ) : (
                  <p className="profile-empty">
                    Sua turma ainda não tem jogos cadastrados.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
