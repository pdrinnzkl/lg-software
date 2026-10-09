import type { Metadata } from "next";
import { AppShell } from "../../../features/system/AppShell";

export const metadata: Metadata = {
  title: "Agenda — Interclasse LGF",
  description: "Agenda completa de jogos do Interclasse LGF.",
};
export default function Agenda() {
  return <AppShell page="agenda" />;
}
