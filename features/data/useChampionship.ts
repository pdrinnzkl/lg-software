"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChampionshipData } from "../../lib/types";

const emptyData: ChampionshipData = {
  classes: [],
  sports: [],
  matches: [],
  events: [],
  users: [],
};

export function useChampionship(pollLive = false) {
  const [data, setData] = useState<ChampionshipData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/data", { cache: "no-store" });
      if (!response.ok)
        throw new Error("Não foi possível carregar o campeonato.");
      setData((await response.json()) as ChampionshipData);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);
  useEffect(() => {
    if (!pollLive) return;
    const interval = window.setInterval(refresh, 2500);
    return () => window.clearInterval(interval);
  }, [pollLive, refresh]);
  return { data, loading, error, refresh, setData };
}
