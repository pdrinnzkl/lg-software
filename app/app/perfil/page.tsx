import type { Metadata } from "next";
import { AppShell } from "../../../features/system/AppShell";

export const metadata: Metadata = {
  title: "Perfil — Interclasse LGF",
  description: "Seu perfil e sua turma no Interclasse LGF.",
};
export default function Profile() {
  return <AppShell page="profile" />;
}
