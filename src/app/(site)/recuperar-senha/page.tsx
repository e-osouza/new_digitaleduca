import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { estaAutenticado } from "@/lib/session";
import { FormularioRecuperarSenha } from "@/components/formulario-recuperar-senha";

export const metadata: Metadata = { title: "Recuperar senha" };

export default async function RecuperarSenha() {
  if (await estaAutenticado()) redirect("/inicio");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8 px-4 py-16 sm:py-24">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Recuperar senha
        </h1>
        <p className="text-texto-3 text-sm">
          Em três passos: e-mail, código e nova senha.
        </p>
      </div>

      <FormularioRecuperarSenha />
    </div>
  );
}
