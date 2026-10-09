import type { Metadata } from "next";
import { ControlCenter } from "../../../features/referee/ControlCenter";

export const metadata: Metadata = {
  title: "Central da partida — Interclasse LGF",
  description: "Controle protegido de placar e eventos.",
};
export default async function MatchControl({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ControlCenter matchId={id} />;
}
