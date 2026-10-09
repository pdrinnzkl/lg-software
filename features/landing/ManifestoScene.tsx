"use client";

import { useEffect, useRef, useState } from "react";

export function ManifestoScene() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const element = section.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.min(0.999, Math.max(0, -rect.top / travel));
      setActive(Math.min(2, Math.floor(progress * 3)));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <section
      ref={section}
      className="scene-manifesto"
      aria-label="O campeonato"
    >
      <div className="manifesto-sticky">
        <div className="scene-kicker">01 — O CAMPEONATO</div>
        <div className="manifesto-copy">
          <span className={active === 0 ? "is-active" : ""}>
            Quando a escola
          </span>
          <strong className={active === 1 ? "is-active" : ""}>
            entra em quadra,
          </strong>
          <span className={active === 2 ? "is-active" : ""}>
            tudo se transforma.
          </span>
        </div>
        <p>
          Uma experiência digital viva, criada para o ritmo real do Interclasse
          LGF.
        </p>
      </div>
    </section>
  );
}
