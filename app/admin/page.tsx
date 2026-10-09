import type { Metadata } from "next";
import { AppShell } from "../../features/system/AppShell";

export const metadata: Metadata = {
  title: "Administração — Interclasse LGF",
  description: "Gestão protegida do Interclasse LGF.",
};
export default function Admin() {
  return <AppShell page="admin" />;
}
