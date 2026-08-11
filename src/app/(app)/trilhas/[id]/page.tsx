import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { normalizarTrilhas, obterTrilha } from "@/lib/queries";
import { FAIXA } from "@/lib/ui";

export const metadata: Metadata = { title: "Trilha" };

export default async function PaginaTrilha({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const bruta = await obterTrilha(numero);
  if (!bruta) notFound();

  const [trilha] = normalizarTrilhas([bruta]);
  if (!trilha) notFound();

  const pct =
    trilha.progresso ??
    (trilha.concluidos !== null && trilha.totalItens
      ? Math.round((trilha.concluidos / trilha.totalItens) * 100)
      : null);

  return (
    <div className={`${FAIXA} flex flex-col gap-6 py-8 sm:gap-8 sm:py-10`}>
      <Link
        href="/trilhas"
        className="text-texto-3 hover:text-acento w-fit text-sm transition-colors"
      >
        ← Trilhas
      </Link>

      <header className="flex flex-col gap-3">
        <h1 className="font-display text-xl leading-tight font-semibold tracking-tight text-balance sm:text-2xl lg:text-3xl">
          {trilha.titulo}
        </h1>

        {trilha.descricao && (
          <p className="text-texto-2 max-w-2xl leading-relaxed">
            {trilha.descricao}
          </p>
        )}

        {pct !== null && (
          <div className="flex max-w-md flex-col gap-1.5 pt-1">
            <div className="text-texto-3 flex justify-between text-xs tabular-nums">
              <span>Progresso</span>
              <span>{Math.round(pct)}%</span>
            </div>
            <div className="bg-superficie-2 h-2 overflow-hidden rounded-full">
              <div
                className="bg-acento ease-suave h-full rounded-full transition-[width] duration-500"
                style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
              />
            </div>
          </div>
        )}
      </header>

      <p className="border-borda-suave text-texto-3 rounded-xl border border-dashed p-5 text-sm leading-relaxed">
        A listagem de aulas desta trilha ainda não está conectada: os endpoints
        de trilha não têm contrato publicado na documentação da API. Assim que o
        formato for confirmado, os itens aparecem aqui com o progresso de cada
        um.
      </p>
    </div>
  );
}
