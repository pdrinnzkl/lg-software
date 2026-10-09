import type { Metadata } from "next";
import { AppShell } from "../../features/system/AppShell";

export const metadata: Metadata = {
  title: "Arbitragem — Interclasse LGF",
  description: "Jogos atribuídos e controles do árbitro.",
};
export default function Referee() {
  return <AppShell page="referee" />;
}
