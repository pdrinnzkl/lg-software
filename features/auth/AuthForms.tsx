"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, useState } from "react";

function AuthBrand() {
  return (
    <Link className="auth-brand" href="/">
      <span className="brand-mark">
        <Image
          src="/logo-escola.png"
          alt="Logo oficial da escola"
          width={42}
          height={42}
          priority
        />
      </span>
      <span>
        <strong>LGF</strong>
        <small>INTERCLASSE 2026</small>
      </span>
    </Link>
  );
}

function AuthAside({ register = false }: { register?: boolean }) {
  return (
    <aside className="auth-aside">
      <div className="auth-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="auth-aside-copy">
        <p>CAMPEONATO CONECTADO</p>
        <h2>
          {register ? (
            <>
              Sua turma.
              <br />
              Sua <em>história.</em>
            </>
          ) : (
            <>
              Toda a emoção.
              <br />
              Um só <em>lugar.</em>
            </>
          )}
        </h2>
        <div className="auth-live-card glass-panel">
          <span className="status-dot" />
          <div>
            <small>AGORA NA QUADRA</small>
            <strong>
              3º A <i>02 : 01</i> 2º B
            </strong>
          </div>
          <b>18:42</b>
        </div>
      </div>
      <div className="auth-aside-foot">
        <span>FUTSAL · VÔLEI · BASQUETE</span>
        <span>LGF © 2026</span>
      </div>
    </aside>
  );
}

export function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const result = (await response.json()) as {
        error?: string;
        user?: { role: string };
      };
      if (!response.ok)
        throw new Error(result.error || "Não foi possível entrar.");
      window.location.href =
        result.user?.role === "ADMIN"
          ? "/admin"
          : result.user?.role === "REFEREE"
            ? "/arbitragem"
            : "/app";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <AuthAside />
      <section className="auth-panel">
        <div className="auth-panel-top">
          <AuthBrand />
          <Link href="/" className="back-link">
            <ArrowLeft size={14} /> Voltar
          </Link>
        </div>
        <div className="auth-form-wrap">
          <div className="auth-heading">
            <p>ACESSO AO SISTEMA</p>
            <h1>Bem-vindo de volta.</h1>
            <span>
              Entre para acompanhar sua turma e cada momento do campeonato.
            </span>
          </div>
          <form className="auth-form" onSubmit={submit}>
            <label>
              <span>Usuário ou e-mail</span>
              <input
                autoComplete="username"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="seu.usuario"
                required
              />
            </label>
            <label>
              <span>Senha</span>
              <div className="password-field">
                <input
                  autoComplete="current-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="submit-button" disabled={busy}>
              {busy ? "ENTRANDO..." : "ENTRAR"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            Ainda não faz parte?{" "}
            <Link href="/registro">
              Criar minha conta <ArrowRight size={13} />
            </Link>
          </p>
        </div>
        <div className="auth-security">
          <LockKeyhole size={13} /> Ambiente protegido · permissões por perfil
        </div>
      </section>
    </main>
  );
}

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [requestedRole, setRequestedRole] = useState("STUDENT");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    if (body.password !== body.confirmPassword) {
      setError("As senhas não coincidem.");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as {
        error?: string;
        user?: { role: string };
      };
      if (!response.ok)
        throw new Error(result.error || "Não foi possível criar a conta.");
      window.location.href =
        result.user?.role === "ADMIN"
          ? "/admin"
          : result.user?.role === "REFEREE"
            ? "/arbitragem"
            : "/app/perfil";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro inesperado.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-layout register-layout">
      <AuthAside register />
      <section className="auth-panel">
        <div className="auth-panel-top">
          <AuthBrand />
          <Link href="/entrar" className="back-link">
            <ArrowLeft size={14} /> Já tenho conta
          </Link>
        </div>
        <div className="auth-form-wrap register-wrap">
          <div className="auth-heading">
            <p>NOVA CONTA</p>
            <h1>Entre para o time.</h1>
            <span>
              Crie seu perfil para acompanhar o campeonato. Árbitros e
              professores podem ativar o acesso com um código da escola.
            </span>
          </div>
          <form className="auth-form register-form" onSubmit={submit}>
            <div className="form-grid">
              <label>
                <span>Nome</span>
                <input
                  name="firstName"
                  autoComplete="given-name"
                  placeholder="Pedro"
                  required
                />
              </label>
              <label>
                <span>Sobrenome</span>
                <input
                  name="lastName"
                  autoComplete="family-name"
                  placeholder="Almeida"
                  required
                />
              </label>
            </div>
            <div className="form-grid">
              <label>
                <span>Usuário</span>
                <input
                  name="username"
                  autoComplete="username"
                  placeholder="pedro.almeida"
                  required
                />
              </label>
              <label>
                <span>E-mail</span>
                <input
                  name="email"
                  autoComplete="email"
                  type="email"
                  placeholder="voce@escola.com"
                  required
                />
              </label>
            </div>
            <div className="form-grid">
              <label>
                <span>Senha</span>
                <div className="password-field">
                  <input
                    name="password"
                    autoComplete="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 10 caracteres"
                    minLength={10}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label="Alternar visibilidade da senha"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              <label>
                <span>Confirmar senha</span>
                <input
                  name="confirmPassword"
                  autoComplete="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repita a senha"
                  required
                />
              </label>
            </div>
            <div className="form-grid">
              <label>
                <span>Tipo de acesso</span>
                <select
                  name="requestedRole"
                  value={requestedRole}
                  onChange={(event) => setRequestedRole(event.target.value)}
                >
                  <option value="STUDENT">Aluno</option>
                  <option value="REFEREE">Árbitro (pedir acesso)</option>
                  <option value="ADMIN">Professor(a) / gestão</option>
                </select>
              </label>
              <label>
                <span>Turma / equipe</span>
                <select
                  name="classId"
                  defaultValue=""
                  required={requestedRole === "STUDENT"}
                >
                  <option value="">
                    {requestedRole === "STUDENT"
                      ? "Selecione sua turma"
                      : "Sem turma"}
                  </option>
                  {["1A", "1B", "1C", "2A", "2B", "2C", "3A", "3B", "3C"].map(
                    (team) => (
                      <option value={team} key={team}>
                        {team[0]}º {team[1]}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
            {requestedRole !== "STUDENT" && (
              <label>
                <span>
                  {requestedRole === "REFEREE"
                    ? "Código inicial de acesso à arbitragem"
                    : "Código inicial de acesso de professor(a)"}
                </span>
                <input
                  name="setupCode"
                  type="password"
                  autoComplete="off"
                  placeholder="Se você recebeu um código da escola"
                />
              </label>
            )}
            <div className="role-note">
              <ShieldCheck size={17} />
              <div>
                <strong>
                  {requestedRole === "STUDENT"
                    ? "Perfil de aluno"
                    : "Acesso protegido por código"}
                </strong>
                <span>
                  {requestedRole === "STUDENT"
                    ? "Você pode trocar de turma no seu perfil."
                    : "Sem um código válido, a gestão precisa aprovar sua solicitação."}
                </span>
              </div>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="submit-button" disabled={busy}>
              {busy ? "CRIANDO CONTA..." : "CRIAR CONTA"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            Ao continuar, você concorda com as regras do campeonato.
          </p>
        </div>
      </section>
    </main>
  );
}
