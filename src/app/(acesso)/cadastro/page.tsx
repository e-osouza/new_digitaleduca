import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { estaAutenticado } from "@/lib/session";
import { FormularioCadastro } from "@/components/formulario-cadastro";
import { MolduraAcesso } from "@/components/moldura-acesso";

export const metadata: Metadata = { title: "Criar conta" };

export default async function Cadastro() {
  if (await estaAutenticado()) redirect("/");

  return (
    <MolduraAcesso
      titulo="Criar conta"
      descricao="Comece pelos conteúdos liberados e evolua quando quiser."
    >
      <FormularioCadastro />
    </MolduraAcesso>
  );
}
