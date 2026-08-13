import type { Metadata } from "next";
import Link from "next/link";
import { catalogoTrilha } from "@/lib/queries";
import { QuestionarioTrilha } from "@/components/questionario-trilha";
import { MontadorTrilha } from "@/components/montador-trilha";

export const metadata: Metadata = { title: "Nova trilha" };

export default async function NovaTrilha({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string }>;
}) {
  const { modo } = await searchParams;
  const manual = modo === "manual";

  // O catálogo só é buscado no modo manual — é uma listagem grande.
  const catalogo = manual ? await catalogoTrilha({ limit: 30 }) : null;

  return (
    <div className="calha mx-auto flex w-full max-w-3xl flex-col gap-8 py-8 sm:py-10">
      <header className="flex flex-col gap-1.5 sm:gap-2">
        <Link
          href="/trilhas"
          className="text-texto-3 hover:text-acento w-fit text-sm transition-colors"
        >
          ← Trilhas
        </Link>
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Nova trilha
        </h1>
        <p className="text-texto-3 text-sm">
          {manual
            ? "Escolha as aulas na ordem em que quer assistir."
            : "Seis perguntas rápidas e montamos o caminho para você."}
        </p>
      </header>

      <div className="border-borda-suave flex w-fit gap-1 rounded-full border p-1">
        <Link
          href="/trilhas/nova"
          aria-current={!manual ? "page" : undefined}
          className={`flex min-h-9 items-center rounded-full px-4 text-sm font-medium transition-colors ${
            !manual
              ? "bg-acento text-white"
              : "text-texto-2 hover:text-texto"
          }`}
        >
          Automática
        </Link>
        <Link
          href="/trilhas/nova?modo=manual"
          aria-current={manual ? "page" : undefined}
          className={`flex min-h-9 items-center rounded-full px-4 text-sm font-medium transition-colors ${
            manual ? "bg-acento text-white" : "text-texto-2 hover:text-texto"
          }`}
        >
          Escolher as aulas
        </Link>
      </div>

      {manual ? (
        <MontadorTrilha catalogo={catalogo?.data ?? []} />
      ) : (
        <QuestionarioTrilha />
      )}
    </div>
  );
}
