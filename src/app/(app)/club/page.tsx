import type { Metadata } from "next";
import Link from "next/link";
import { obterMeuTime } from "@/lib/queries";
import { FAIXA } from "@/lib/ui";
import { PainelClub } from "@/components/club/painel";

export const metadata: Metadata = { title: "Digital Club" };

/**
 * Painel do dono do Club.
 *
 * Abre inclusive com a participação vencida: `ativo: false` mantém o time
 * visível e trava só o convite. Quem venceu é justamente quem precisa entrar
 * aqui para entender por que o time parou — um 403 no lugar disso seria a
 * porta batendo na cara de quem veio resolver.
 */
export default async function PaginaClub() {
  const time = await obterMeuTime();

  if (!time) {
    return (
      <div className={`${FAIXA} mx-auto flex max-w-2xl flex-col gap-5 py-10`}>
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
          Digital Club
        </h1>
        <p className="text-texto-2 text-sm">
          O Digital Club é para quem leva a equipe junto: você convida pessoas do seu
          time e todas passam a ver o conteúdo da plataforma pela sua
          participação. Sua conta não faz parte do Club hoje.
        </p>
        <Link
          href="/planos"
          className="bg-acento hover:bg-acento-hover flex min-h-12 w-fit items-center rounded-full px-7 text-sm font-bold text-white transition-colors"
        >
          Ver planos
        </Link>
      </div>
    );
  }

  return (
    <div className={`${FAIXA} mx-auto flex max-w-3xl flex-col gap-6 py-8 sm:gap-8 sm:py-10`}>
      <header className="flex flex-col gap-1.5">
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Digital Club
        </h1>
        <p className="text-texto-3 text-sm">
          Quem está no seu time vê todo o conteúdo pela sua participação.
        </p>
      </header>

      <PainelClub time={time} />
    </div>
  );
}
