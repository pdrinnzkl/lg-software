import Image from "next/image";
import { ArrowDown, ArrowUpRight, Trophy } from "lucide-react";
import { UpcomingGamesCoverflow } from "../../components/ui/upcoming-games-coverflow";
import {
  WorksWheel,
  type WorksWheelItem,
} from "../../components/ui/works-wheel";
import { ManifestoScene } from "./ManifestoScene";

const modalities: WorksWheelItem[] = [
  {
    title: "Futsal",
    image: "/images/modalities/futsal.webp",
    href: "/app/agenda?modalidade=futsal",
  },
  {
    title: "Vôlei",
    image: "/images/modalities/volei.webp",
    href: "/app/agenda?modalidade=volleyball",
  },
  {
    title: "Basquete",
    image: "/images/modalities/basquete.webp",
    href: "/app/agenda?modalidade=basketball",
  },
];

export function LandingExperience() {
  return (
    <main className="landing-shell">
      <nav className="landing-nav" aria-label="Navegação principal">
        <a
          className="brand"
          href="#inicio"
          aria-label="Interclasse LGF — início"
        >
          <span className="brand-mark">
            <Image
              src="/logo-escola.png"
              alt="Logo oficial da E.E. Prof. Luiz Gonzaga de Camargo Fleury"
              width={42}
              height={42}
              priority
            />
          </span>
          <span>
            <strong>LGF</strong>
            <small>INTERCLASSE 2026</small>
          </span>
        </a>
        <div className="landing-links">
          <a href="#modalidades">Modalidades</a>
          <a href="#jogos">Jogos</a>
          <a href="#classificacao">Classificação</a>
        </div>
        <a className="nav-cta" href="/entrar">
          Acessar sistema <ArrowUpRight size={15} />
        </a>
      </nav>

      <div id="cinematic-sequence" className="cinematic-sequence">
        <section id="inicio" className="scroll-scene scene-opening">
          <div className="scene-grid">
            <div className="scene-copy">
              <p className="eyebrow">
                <span /> E.E. PROF. LUIZ GONZAGA FLEURY
              </p>
              <h1>
                O jogo começa
                <br />
                antes do <em>apito.</em>
              </h1>
              <p className="scene-lede">
                Cada lance. Cada turma. Uma só história — acompanhada ao vivo
                por toda a escola.
              </p>
              <div className="hero-actions">
                <a className="button-light" href="/entrar">
                  Entrar no campeonato <ArrowUpRight size={16} />
                </a>
                <a className="button-ghost" href="#modalidades">
                  Explorar experiência <ArrowDown size={15} />
                </a>
              </div>
            </div>
          </div>
          <div className="scene-footer">
            <span>FUTSAL · VÔLEI · BASQUETE</span>
            <span>
              ROLE PARA EXPLORAR <ArrowDown size={13} />
            </span>
          </div>
        </section>

        <ManifestoScene />

        <section className="scroll-scene scene-modalities">
          <div className="scene-kicker">02 — MODALIDADES</div>
          <div className="modality-feature">
            <p>TRÊS FORMAS DE JOGAR</p>
            <h2>
              FUTSAL<span>↗</span>
            </h2>
            <p className="modality-note">velocidade / técnica / decisão</p>
          </div>
        </section>

        <section className="scroll-scene scene-modalities scene-modalities-volley">
          <div className="scene-kicker">A BOLA MUDA. A ENERGIA NÃO.</div>
          <div className="modality-feature right">
            <p>COORDENAÇÃO EM MOVIMENTO</p>
            <h2>
              VÔLEI<span>02</span>
            </h2>
            <p className="modality-note">ritmo / conexão / precisão</p>
          </div>
        </section>

        <section className="scroll-scene scene-modalities scene-modalities-basket">
          <div className="scene-kicker">03 — TODO PONTO CONTA</div>
          <div className="modality-feature">
            <p>VISÃO, ESPAÇO E TEMPO</p>
            <h2>
              BASQUETE<span>03</span>
            </h2>
            <p className="modality-note">intensidade / equipe / atitude</p>
          </div>
        </section>

        <section id="jogos" className="scroll-scene scene-games">
          <div className="games-interface glass-panel">
            <div className="interface-heading">
              <div>
                <p>03 — AGENDA</p>
                <h2>Próximos jogos</h2>
              </div>
              <a href="/app/agenda">
                Agenda completa <ArrowUpRight size={15} />
              </a>
            </div>
            <UpcomingGamesCoverflow />
          </div>
        </section>

        <section id="classificacao" className="scroll-scene scene-trophy">
          <div className="trophy-copy">
            <div className="scene-kicker">04 — CLASSIFICAÇÃO</div>
            <h2>
              Quem vai
              <br />
              levar o <em>título?</em>
            </h2>
            <p>
              A tabela nasce dos resultados. Cada vitória reorganiza a disputa
              em tempo real.
            </p>
          </div>
          <div className="ranking-preview glass-panel">
            <div className="ranking-head">
              <span>GERAL</span>
              <span>PTS</span>
            </div>
            {[
              ["01", "3º A", "12"],
              ["02", "3º B", "09"],
              ["03", "1º B", "07"],
            ].map((row, index) => (
              <div
                className={`ranking-row ${index === 0 ? "leader" : ""}`}
                key={row[1]}
              >
                <span>{row[0]}</span>
                <strong>{row[1]}</strong>
                <i>{index === 0 ? "▲ 2" : index === 1 ? "—" : "▲ 1"}</i>
                <b>{row[2]}</b>
              </div>
            ))}
            <a href="/app/classificacao">
              Ver classificação completa <ArrowUpRight size={14} />
            </a>
          </div>
        </section>

        <section className="scroll-scene scene-final">
          <div className="final-content">
            <Image
              src="/logo-escola.png"
              alt="Logo oficial da escola"
              width={94}
              height={94}
            />
            <p>E.E. PROF. LUIZ GONZAGA FLEURY</p>
            <h2>
              INTERCLASSE
              <br />
              <em>2026</em>
            </h2>
            <a className="button-light final-button" href="/entrar">
              Acessar o sistema <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="final-stats">
            <div>
              <strong>09</strong>
              <span>turmas</span>
            </div>
            <div>
              <strong>03</strong>
              <span>modalidades</span>
            </div>
            <div>
              <Trophy size={23} />
              <span>um só título</span>
            </div>
          </div>
        </section>
      </div>

      <section
        id="modalidades"
        className="modalities-index"
        aria-label="Modalidades disponíveis"
      >
        <div className="modalities-wheel-heading">
          <p className="section-label">TODAS AS MODALIDADES</p>
          <h2>
            Entre em <em>quadra.</em>
          </h2>
        </div>
        <WorksWheel items={modalities} label="INTERCLASSE 2026" />
      </section>
      <footer className="landing-footer">
        <div className="brand">
          <span className="brand-mark">
            <Image src="/logo-escola.png" alt="" width={38} height={38} />
          </span>
          <span>
            <strong>LGF</strong>
            <small>INTERCLASSE 2026</small>
          </span>
        </div>
        <p>
          Sistema oficial de gestão esportiva da E.E. Prof. Luiz Gonzaga de
          Camargo Fleury.
        </p>
        <span className="footer-links">
          <a href="#inicio">VOLTAR AO TOPO ↑</a>
        </span>
      </footer>
    </main>
  );
}
