import type { Metadata } from "next";
import Link from "next/link";
import { catalogoLista } from "@/lib/queries";
import { MontadorLista } from "@/components/montador-lista";

export const metadata: Metadata = { title: "Nova lista" };

export default async function NovaLista() {
  const catalogo = await catalogoLista({ limit: 30 });

  return (
    <div className="calha mx-auto flex w-full max-w-3xl flex-col gap-8 py-8 sm:py-10">
      <header className="flex flex-col gap-1.5 sm:gap-2">
        <Link
          href="/listas"
          className="text-texto-3 hover:text-acento w-fit text-sm transition-colors"
        >
          ← Minhas listas
        </Link>
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Nova lista
        </h1>
        <p className="text-texto-3 text-sm">
          Escolha as aulas na ordem em que quer assistir.
        </p>
      </header>

      <MontadorLista catalogo={catalogo?.data ?? []} />
    </div>
  );
}
