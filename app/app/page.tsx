import type { Metadata } from "next";
import { AppShell } from "../../features/system/AppShell";

export const metadata: Metadata = {
  title: "Início — Interclasse LGF",
  description: "Seu painel no Interclasse LGF.",
};
export default function Dashboard() {
  return <AppShell page="dashboard" />;
}
