import type { Metadata } from "next";
import Link from "next/link";
import { obterConvite } from "@/lib/queries";
import { FormularioConvite } from "@/components/formulario-convite";

export const metadata: Metadata = { title: "Convite" };

/** Por que o convite não pode ser aceito, dito de forma útil. */
const RECUSAS: Record<string, { titulo: string; texto: string }> = {
  ACEITO: {
    titulo: "Este convite já foi aceito",
    texto:
      "A conta já está no time. Basta entrar normalmente para ver o conteúdo.",
  },
  CANCELADO: {
    titulo: "Este convite foi cancelado",
    texto: "Quem convidou desfez o convite. Peça um novo para entrar no time.",
  },
  EXPIRADO: {
    titulo: "Este convite expirou",
    texto: "Convites valem por 14 dias. Peça um novo a quem chamou você.",
  },
  CLUB_ENCERRADO: {
    titulo: "Este convite não vale mais",
    texto:
      "A participação de quem convidou não está mais ativa no Club, então o convite não libera acesso.",
  },
};

export default async function PaginaConvite({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const convite = await obterConvite(token);

  if (!convite) {
    return (
      <Moldura titulo="Convite não encontrado">
        <p className="text-texto-2 text-sm">
          O link pode ter sido digitado errado ou o convite não existe mais.
        </p>
        <Voltar />
      </Moldura>
    );
  }

  const recusa = RECUSAS[convite.situacao];

  if (recusa) {
    return (
      <Moldura titulo={recusa.titulo}>
        <p className="text-texto-2 text-sm">{recusa.texto}</p>
        <Voltar />
      </Moldura>
    );
  }

  return (
    <Moldura titulo={`${convite.convidadoPor} convidou você`}>
      <p className="text-texto-2 text-sm">
        Entrando no time, você vê todo o conteúdo da Digital Educa enquanto
        fizer parte dele — sem pagar nada.
      </p>

      <FormularioConvite token={token} convite={convite} />
    </Moldura>
  );
}

function Moldura({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="border-borda bg-superficie flex w-full max-w-md flex-col gap-5 rounded-2xl border p-6 sm:p-8">
        <h1 className="font-display text-xl font-semibold tracking-tight">
          {titulo}
        </h1>
        {children}
      </div>
    </main>
  );
}

function Voltar() {
  return (
    <Link
      href="/"
      className="bg-acento text-white hover:bg-acento-hover flex min-h-12 items-center justify-center rounded-full px-7 text-sm font-bold transition-colors"
    >
      Ir para a plataforma
    </Link>
  );
}
