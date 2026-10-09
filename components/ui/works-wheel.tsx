"use client";

import * as React from "react";

export interface WorksWheelItem {
  title: string;
  image: string;
  href: string;
}

interface WorksWheelProps {
  items: WorksWheelItem[];
  label: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const rad = (degrees: number) => (degrees * Math.PI) / 180;

export function WorksWheel({ items, label }: WorksWheelProps) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const wheelRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const labelRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);
  const turn = React.useRef(0);
  const target = React.useRef(0);
  const frame = React.useRef(0);
  const settling = React.useRef(0);
  const drag = React.useRef<{ point: number; moved: boolean } | null>(null);
  const preventClick = React.useRef(false);
  const drawRef = React.useRef<() => void>(() => {});
  const [selected, setSelected] = React.useState(0);
  const [stage, setStage] = React.useState({ width: 0, height: 0 });
  const [active, setActive] = React.useState(0);
  const [reducedMotion, setReducedMotion] = React.useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const count = items.length;

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  React.useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const measure = () =>
      setStage({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const metrics = React.useMemo(() => {
    const { width, height } = stage;
    const cardWidth = Math.min(
      height * 0.38 * 1.45,
      width * (width < 640 ? 0.53 : 0.34),
    );
    const cardHeight = cardWidth / 1.45;
    const ringRadius = cardHeight * (width < 640 ? 1.06 : 1.14);
    const ringScale = count
      ? clamp(
          (((2 * Math.PI * ringRadius) / count) * 0.82) / (cardWidth || 1),
          0.16,
          1,
        )
      : 1;
    return {
      cardWidth,
      cardHeight,
      ringRadius,
      ringScale,
      drumRadius: cardHeight * 2.22,
      bow: cardHeight * 1.82,
      depth: cardHeight * 2.7,
    };
  }, [stage, count]);

  const draw = React.useCallback(() => {
    const gap = target.current - turn.current;
    turn.current =
      Math.abs(gap) < 0.0005
        ? target.current
        : turn.current + gap * (reducedMotion ? 1 : 0.12);
    const transition = clamp(turn.current, 0, 1);
    const position = Math.max(0, turn.current - 1);

    if (wheelRef.current)
      wheelRef.current.style.transform = `translateZ(${-transition * metrics.drumRadius}px)`;
    for (let index = 0; index < count; index++) {
      const card = cardRefs.current[index];
      if (!card) continue;
      const distance = index - position;
      const drumAngle = distance * 40;
      const ringAngle = distance * (360 / count);
      const bowOffset = -metrics.bow * (1 - Math.cos(rad(drumAngle)));
      card.style.transform = `translateX(${transition * bowOffset}px) rotateZ(${(1 - transition) * ringAngle}deg) translateY(${-(1 - transition) * metrics.ringRadius}px) rotateX(${transition * drumAngle}deg) translateZ(${transition * metrics.drumRadius}px)`;
      card.style.opacity =
        transition > 0.5 && Math.abs(distance) > 1.6 ? "0" : "1";
      card.style.zIndex = String(Math.round(100 - Math.abs(distance) * 2));
      card.style.pointerEvents =
        transition > 0.5 && Math.abs(distance) > 0.55 ? "none" : "auto";
      const face = card.firstElementChild as HTMLElement | null;
      if (face)
        face.style.transform = `scale(${metrics.ringScale + (1 - metrics.ringScale) * transition})`;
    }
    if (labelRef.current)
      labelRef.current.style.opacity = String(1 - transition);
    if (titleRef.current) titleRef.current.style.opacity = String(transition);
    const nearest = clamp(Math.round(position), 0, count - 1);
    setActive((previous) => (previous === nearest ? previous : nearest));
    if (Math.abs(target.current - turn.current) > 0.0005)
      frame.current = requestAnimationFrame(() => drawRef.current());
    else frame.current = 0;
  }, [count, metrics, reducedMotion]);

  React.useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  const moveTo = React.useCallback(
    (next: number) => {
      target.current = clamp(next, 0, count);
      if (!frame.current)
        frame.current = requestAnimationFrame(() => drawRef.current());
    },
    [count],
  );

  React.useEffect(() => {
    if (!stage.height || !count) return;
    drawRef.current();
    return () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [stage.height, count, draw]);

  React.useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      const delta =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.height : 1);
      const next = target.current + delta / 900;
      const canMove = delta > 0 ? target.current < count : target.current > 0;
      if (!canMove) return;
      event.preventDefault();
      moveTo(next);
      window.clearTimeout(settling.current);
      settling.current = window.setTimeout(
        () => moveTo(Math.round(target.current)),
        140,
      );
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", onWheel);
      window.clearTimeout(settling.current);
    };
  }, [count, moveTo, stage.height]);

  if (!count) return null;

  return (
    <div className="works-wheel">
      {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- Drag/keyboard stage is an interactive carousel region. */}
      <div
        ref={stageRef}
        className="works-wheel-stage"
        tabIndex={0}
        role="application"
        aria-roledescription="carrossel de modalidades"
        aria-label={label}
        style={{ perspective: `${metrics.depth}px` }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse" && event.button !== 0) return;
          drag.current = {
            point:
              event.pointerType === "touch" ? event.clientX : event.clientY,
            moved: false,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const point =
            event.pointerType === "touch" ? event.clientX : event.clientY;
          const distance = drag.current.point - point;
          if (Math.abs(distance) > 2) drag.current.moved = true;
          moveTo(
            target.current +
              distance / (event.pointerType === "touch" ? 250 : 420),
          );
          drag.current.point = point;
        }}
        onPointerUp={() => {
          preventClick.current = Boolean(drag.current?.moved);
          drag.current = null;
          if (target.current > 0) moveTo(Math.round(target.current));
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onClickCapture={(event) => {
          if (preventClick.current) {
            event.preventDefault();
            preventClick.current = false;
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowRight")
            moveTo(Math.round(target.current) + 1);
          else if (event.key === "ArrowUp" || event.key === "ArrowLeft")
            moveTo(Math.round(target.current) - 1);
          else return;
          event.preventDefault();
        }}
      >
        <div ref={wheelRef} className="works-wheel-track">
          {items.map((item, index) => (
            <a
              key={item.title}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              className="works-wheel-card"
              href={item.href}
              aria-label={`Ver jogos de ${item.title}`}
              style={{
                width: metrics.cardWidth,
                height: metrics.cardHeight,
                marginLeft: -metrics.cardWidth / 2,
                marginTop: -metrics.cardHeight / 2,
              }}
            >
              <span className="works-wheel-face">
                <img
                  src={item.image}
                  alt={item.title}
                  draggable={false}
                  loading="lazy"
                />
                <span className="works-wheel-card-caption">
                  {item.title}
                  <span aria-hidden="true">↗</span>
                </span>
              </span>
            </a>
          ))}
        </div>
        <div ref={labelRef} className="works-wheel-center" aria-hidden="true">
          {label}
        </div>
        <div ref={titleRef} className="works-wheel-current" aria-live="polite">
          {items[active]?.title}
        </div>
      </div>
      {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      <div className="works-wheel-controls" aria-label="Escolher modalidade">
        {items.map((item, index) => (
          <button
            key={item.title}
            type="button"
            className={index === selected ? "is-active" : ""}
            onClick={() => {
              setSelected(index);
              moveTo(index + 1);
            }}
            aria-label={`Mostrar ${item.title}`}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {item.title}
          </button>
        ))}
      </div>
      <p className="works-wheel-hint">
        Role ou arraste para explorar · toque na modalidade para ver os jogos
      </p>
    </div>
  );
}
