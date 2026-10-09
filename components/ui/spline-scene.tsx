"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { Bot } from "lucide-react";

const Spline = lazy(() => import("@splinetool/react-spline"));

type SplineSceneProps = {
  scene: string;
  className?: string;
  label: string;
};

function SceneFallback({ reduced = false }: { reduced?: boolean }) {
  return (
    <div className="spline-scene-fallback" role="status">
      <Bot size={42} strokeWidth={1.35} />
      <span>{reduced ? "Cena 3D pausada" : "Carregando assistente 3D"}</span>
    </div>
  );
}

export function SplineScene({
  scene,
  className = "",
  label,
}: SplineSceneProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  if (reducedMotion) return <SceneFallback reduced />;

  return (
    <div className={`spline-scene ${className}`} role="img" aria-label={label}>
      <Suspense fallback={<SceneFallback />}>
        <Spline scene={scene} className="spline-canvas" />
      </Suspense>
    </div>
  );
}
