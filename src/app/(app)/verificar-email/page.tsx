import type { Metadata } from "next";
import Link from "next/link";
import { normalizarMe, obterMe } from "@/lib/queries";
import { FormularioVerificarEmail } from "@/components/formulario-verificar-email";

export const metadata: Metadata = { title: "Confirmar e-mail" };

export default async function VerificarEmail() {
  const { usuario } = normalizarMe(await obterMe());

  return (
    <div className="calha mx-auto flex w-full max-w-2xl flex-col gap-8 py-8 sm:py-10">
      <header className="flex flex-col gap-1.5 sm:gap-2">
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Confirmar e-mail
        </h1>
        <p className="text-texto-3 text-sm">
          {usuario?.email
            ? `Enviamos um código de 4 dígitos para ${usuario.email}.`
            : "Enviamos um código de 4 dígitos para o e-mail da sua conta."}
        </p>
      </header>

      {usuario?.emailVerified ? (
        <div className="border-borda-suave bg-superficie flex flex-col items-start gap-4 rounded-xl border p-6">
          <p className="text-sucesso font-semibold">Seu e-mail já está confirmado.</p>
          <Link
            href="/inicio"
            className="bg-acento text-fundo hover:bg-acento-hover flex min-h-11 items-center rounded-full px-5 text-sm font-bold transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      ) : usuario?.email ? (
        <FormularioVerificarEmail email={usuario.email} />
      ) : (
        <p className="border-borda-suave text-texto-3 rounded-xl border border-dashed p-5 text-sm">
          Não conseguimos carregar o e-mail da sua conta. Recarregue a página e
          tente de novo.
        </p>
      )}
    </div>
  );
}
