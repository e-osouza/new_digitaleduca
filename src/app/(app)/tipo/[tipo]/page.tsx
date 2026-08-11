import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listarConteudos } from "@/lib/queries";
import { ROTULOS_PLURAIS, TIPOS_NA_URL } from "@/lib/nav";
import { FAIXA } from "@/lib/ui";
import { CardConteudo } from "@/components/card-conteudo";
import { Paginacao } from "@/components/paginacao";

/** 12 = três linhas cheias na grade de 4 colunas do desktop. */
const POR_PAGINA = 12;

const DESCRICOES: Record<string, string> = {
  AULA: "Cursos e super aulas para aplicar no dia a dia do negócio.",
  PALESTRA: "Replays e apresentações de quem já escalou empresas.",
  PODCAST: "Conversas com especialistas, para ouvir enquanto você faz outra coisa.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tipo: string }>;
}): Promise<Metadata> {
  const { tipo } = await params;
  const chave = TIPOS_NA_URL[tipo];
  return { title: chave ? ROTULOS_PLURAIS[chave] : "Conteúdos" };
}

export default async function PaginaTipo({
  params,
  searchParams,
}: {
  params: Promise<{ tipo: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  const [{ tipo }, { pagina }] = await Promise.all([params, searchParams]);

  const chave = TIPOS_NA_URL[tipo];
  if (!chave) notFound();

  const paginaAtual = Math.max(1, Number(pagina) || 1);

  const lista = await listarConteudos({
    tipo: chave,
    page: paginaAtual,
    limit: POR_PAGINA,
  });

  const { total, totalPages } = lista.pagination;

  return (
    <div className={`${FAIXA} flex flex-col gap-6 py-8 sm:gap-8 sm:py-10`}>
      <header className="flex flex-col gap-1.5 sm:gap-2">
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          {ROTULOS_PLURAIS[chave]}
        </h1>
        <p className="text-texto-3 text-sm">
          {DESCRICOES[chave]}
          {total > 0 && (
            <span className="tabular-nums"> · {total} no acervo</span>
          )}
        </p>
      </header>

      {lista.data.length === 0 ? (
        <p className="text-texto-3 text-sm">
          Nenhum conteúdo publicado nesta categoria ainda.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {lista.data.map((conteudo) => (
              <CardConteudo
                key={conteudo.id}
                conteudo={conteudo}
                largura="w-full"
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Paginacao
              base={`/tipo/${tipo}`}
              pagina={paginaAtual}
              totalPaginas={totalPages}
            />
          )}
        </>
      )}
    </div>
  );
}
