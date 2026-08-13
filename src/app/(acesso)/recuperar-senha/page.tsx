import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { estaAutenticado } from "@/lib/session";
import { FormularioRecuperarSenha } from "@/components/formulario-recuperar-senha";
import { MolduraAcesso } from "@/components/moldura-acesso";

export const metadata: Metadata = { title: "Recuperar senha" };

export default async function RecuperarSenha() {
  if (await estaAutenticado()) redirect("/inicio");

  return (
    <MolduraAcesso
      titulo="Recuperar senha"
      descricao="Em três passos: e-mail, código e nova senha."
    >
      <FormularioRecuperarSenha />
    </MolduraAcesso>
  );
}
