import type { Metadata } from "next";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { encerrarSessaoExpirada } from "@/lib/sessao-expirada";
import { buscarConteudos } from "@/lib/queries";
import { CardConteudo } from "@/components/card-conteudo";
import { CampoBusca } from "@/components/campo-busca";
import { Paginacao } from "@/components/paginacao";
import type { Conteudo, TipoConteudo } from "@/types/api";

export const metadata: Metadata = { title: "Buscar" };

/** Mesmo tamanho das páginas de tipo: 3 linhas cheias na grade de 4. */
const POR_PAGINA = 12;

const FILTROS: { rotulo: string; valor?: TipoConteudo }[] = [
  { rotulo: "Tudo" },
  { rotulo: "Aulas", valor: "AULA" },
  { rotulo: "Palestras", valor: "PALESTRA" },
  { rotulo: "Podcasts", valor: "PODCAST" },
];

export default async function Buscar({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; pagina?: string }>;
}) {
  const { q, tipo, pagina } = await searchParams;
  const termo = q?.trim() ?? "";
  const tipoValido = FILTROS.find((f) => f.valor === tipo)?.valor;
  const paginaAtual = Math.max(1, Number(pagina) || 1);

  if (termo.length === 0) {
    return (
      <Moldura termo="" tipoAtivo={undefined}>
        <p className="text-texto-3 text-sm">
          Digite algo acima para encontrar aulas, palestras e podcasts.
        </p>
      </Moldura>
    );
  }

  let resultados: Conteudo[] = [];
  let total = 0;
  let totalPaginas = 1;

  try {
    const resposta = await buscarConteudos({
      q: termo,
      tipo: tipoValido,
      page: paginaAtual,
      limit: POR_PAGINA,
    });
    const normalizado = normalizar(resposta);
    resultados = normalizado.itens;
    total = normalizado.total;
    totalPaginas = normalizado.totalPaginas;
  } catch (erro) {
    if (erro instanceof ApiError && erro.naoAutenticado) {
      encerrarSessaoExpirada(`/buscar?q=${encodeURIComponent(termo)}`);
    }
    throw erro;
  }

  return (
    <Moldura termo={termo} tipoAtivo={tipoValido} total={total}>
      {resultados.length === 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-texto font-semibold">
            Nenhum resultado para “{termo}”.
          </p>
          <p className="text-texto-3 text-sm">
            Tente outra palavra ou remova o filtro de tipo.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {resultados.map((conteudo) => (
              <CardConteudo
                key={conteudo.id}
                conteudo={conteudo}
                largura="w-full"
              />
            ))}
          </div>

          <Paginacao
            base="/buscar"
            pagina={paginaAtual}
            totalPaginas={totalPaginas}
            parametros={{ q: termo, tipo: tipoValido }}
          />
        </>
      )}
    </Moldura>
  );
}

function Moldura({
  termo,
  tipoAtivo,
  total,
  children,
}: {
  termo: string;
  tipoAtivo?: TipoConteudo;
  total?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="calha flex w-full flex-col gap-6 py-8 sm:gap-8 sm:py-10">
      <div className="flex flex-col gap-5">
        <h1 className="font-display text-xl font-semibold tracking-tight text-balance sm:text-2xl lg:text-3xl">
          {termo ? <>Resultados para “{termo}”</> : "Buscar"}
        </h1>

        <CampoBusca termoInicial={termo} tipo={tipoAtivo} />

        {termo && (
          /* No celular os filtros deslizam na horizontal em vez de quebrar linha. */
          <div className="trilho -mx-5 flex items-center gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {FILTROS.map((filtro) => {
              const ativo = filtro.valor === tipoAtivo;
              const parametros = new URLSearchParams({ q: termo });
              if (filtro.valor) parametros.set("tipo", filtro.valor);

              return (
                <Link
                  key={filtro.rotulo}
                  href={`/buscar?${parametros.toString()}`}
                  className={`flex min-h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors duration-200 ${
                    ativo
                      ? "border-acento bg-acento text-fundo"
                      : "border-borda bg-superficie text-texto-2 hover:border-acento/60 hover:bg-superficie-2 hover:text-texto"
                  }`}
                >
                  {filtro.rotulo}
                </Link>
              );
            })}

            {typeof total === "number" && total > 0 && (
              <span className="text-texto-3 ml-1 shrink-0 text-sm tabular-nums">
                {total} {total === 1 ? "resultado" : "resultados"}
              </span>
            )}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}

/**
 * A busca devolve `{data, pagination}` ou `{items, page, total}` conforme a
 * versão. No segundo formato não vem `totalPages`, então calculamos a partir
 * do total e do tamanho da página.
 */
function normalizar(resposta: Awaited<ReturnType<typeof buscarConteudos>>): {
  itens: Conteudo[];
  total: number;
  totalPaginas: number;
} {
  if ("data" in resposta) {
    const total = resposta.pagination?.total ?? resposta.data.length;
    return {
      itens: resposta.data,
      total,
      totalPaginas:
        resposta.pagination?.totalPages || Math.max(1, Math.ceil(total / POR_PAGINA)),
    };
  }

  const itens = resposta.items ?? [];
  const total = resposta.total ?? itens.length;
  return {
    itens,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
  };
}
