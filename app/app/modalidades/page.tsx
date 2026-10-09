import type { Metadata } from "next";
import { AppShell } from "../../../features/system/AppShell";

export const metadata: Metadata = {
  title: "Modalidades — Interclasse LGF",
  description: "Futsal, vôlei e basquete no Interclasse LGF.",
};
export default function Sports() {
  return <AppShell page="sports" />;
}
