import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { estaAutenticado } from "@/lib/session";
import { FormularioLogin } from "@/components/formulario-login";

export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string; expirada?: string }>;
}) {
  const { proximo, expirada } = await searchParams;

  // Quem chega vindo de /api/auth/expirar já teve o cookie apagado; não faz
  // sentido conferir a sessão de novo.
  if (!expirada && (await estaAutenticado())) redirect("/inicio");

  // Só aceitamos caminhos internos — evita redirecionamento para fora do site.
  const destino = proximo?.startsWith("/") ? proximo : "/inicio";

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8 px-4 py-16 sm:py-24">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Entrar
        </h1>
        <p className="text-texto-3 text-sm">
          {expirada
            ? "Sua sessão expirou. Entre de novo para continuar."
            : "Acesse suas trilhas, aulas e o progresso de onde parou."}
        </p>
      </div>

      <Suspense>
        <FormularioLogin proximo={destino} />
      </Suspense>
    </div>
  );
}
