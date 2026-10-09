import type { Metadata } from "next";
import { RegisterForm } from "../../features/auth/AuthForms";

export const metadata: Metadata = {
  title: "Criar conta — Interclasse LGF",
  description: "Crie seu perfil de aluno no Interclasse LGF.",
};
export default function RegisterPage() {
  return <RegisterForm />;
}
