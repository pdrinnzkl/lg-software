import type { Metadata } from "next";
import { LoginForm } from "../../features/auth/AuthForms";

export const metadata: Metadata = {
  title: "Entrar — Interclasse LGF",
  description: "Acesse o sistema do Interclasse LGF.",
};
export default function LoginPage() {
  return <LoginForm />;
}
