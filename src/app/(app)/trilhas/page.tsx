import type { Metadata } from "next";
import Link from "next/link";
import { listarTrilhas, normalizarTrilhas } from "@/lib/queries";
import { FAIXA } from "@/lib/ui";

export const metadata: Metadata = { title: "Trilhas" };

export default async function PaginaTrilhas() {
  const trilhas = normalizarTrilhas(await listarTrilhas());

  return (
    <div className={`${FAIXA} flex flex-col gap-6 py-8 sm:gap-8 sm:py-10`}>
      <header className="flex flex-col gap-1.5 sm:gap-2">
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Trilhas
        </h1>
        <p className="text-texto-3 text-sm">
          Sequências de conteúdo montadas para um objetivo específico.
        </p>
      </header>

      {trilhas.length === 0 ? (
        <div className="border-borda-suave flex flex-col items-start gap-4 rounded-xl border p-6 sm:p-8">
          <div className="flex flex-col gap-1.5">
            <p className="text-texto font-semibold">
              Você ainda não tem nenhuma trilha.
            </p>
            <p className="text-texto-3 max-w-md text-sm leading-relaxed">
              As trilhas montam um caminho de estudo a partir dos seus objetivos.
              Enquanto isso, explore o acervo e comece pelo que fizer mais
              sentido agora.
            </p>
          </div>
          <Link
            href="/inicio"
            className="bg-acento text-fundo hover:bg-acento-hover flex min-h-11 items-center rounded-full px-5 text-sm font-bold transition-colors"
          >
            Explorar conteúdos
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {trilhas.map((trilha) => {
            const pct =
              trilha.progresso ??
              (trilha.concluidos !== null && trilha.totalItens
                ? Math.round((trilha.concluidos / trilha.totalItens) * 100)
                : null);

            return (
              <li key={trilha.id}>
                <Link
                  href={`/trilhas/${trilha.id}`}
                  className="border-borda-suave bg-superficie hover:border-acento/60 ease-suave flex h-full flex-col gap-3 rounded-xl border p-5 transition-[border-color,transform] duration-200 active:scale-[0.99]"
                >
                  <h2 className="font-display text-base leading-snug font-semibold text-balance">
                    {trilha.titulo}
                  </h2>

                  {trilha.descricao && (
                    <p className="text-texto-3 line-clamp-3 text-sm leading-relaxed">
                      {trilha.descricao}
                    </p>
                  )}

                  <div className="mt-auto flex flex-col gap-2 pt-2">
                    {trilha.totalItens !== null && (
                      <span className="text-texto-3 text-xs tabular-nums">
                        {trilha.concluidos !== null
                          ? `${trilha.concluidos} de ${trilha.totalItens} concluídos`
                          : `${trilha.totalItens} itens`}
                      </span>
                    )}

                    {pct !== null && (
                      <div
                        className="bg-superficie-2 h-1.5 overflow-hidden rounded-full"
                        role="presentation"
                      >
                        <div
                          className="bg-acento ease-suave h-full rounded-full transition-[width] duration-500"
                          style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
