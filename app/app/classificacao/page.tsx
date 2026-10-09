import type { Metadata } from "next";
import { AppShell } from "../../../features/system/AppShell";

export const metadata: Metadata = {
  title: "Classificação — Interclasse LGF",
  description: "Classificação geral e por ano do Interclasse LGF.",
};
export default function Standings() {
  return <AppShell page="standings" />;
}
