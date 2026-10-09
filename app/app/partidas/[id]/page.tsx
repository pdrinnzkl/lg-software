import type { Metadata } from "next";
import { AppShell } from "../../../../features/system/AppShell";

export const metadata: Metadata = {
  title: "Partida — Interclasse LGF",
  description: "Placar, eventos e informações da partida.",
};
export default async function MatchDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AppShell page="match" matchId={id} />;
}
