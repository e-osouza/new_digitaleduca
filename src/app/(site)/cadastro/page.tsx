import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { estaAutenticado } from "@/lib/session";
import { FormularioCadastro } from "@/components/formulario-cadastro";

export const metadata: Metadata = { title: "Criar conta" };

export default async function Cadastro() {
  if (await estaAutenticado()) redirect("/");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8 px-4 py-16 sm:py-24">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Criar conta
        </h1>
        <p className="text-texto-3 text-sm">
          Comece pelos conteúdos liberados e evolua quando quiser.
        </p>
      </div>

      <FormularioCadastro />
    </div>
  );
}
