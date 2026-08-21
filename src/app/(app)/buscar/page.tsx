import type { Metadata } from "next";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { encerrarSessaoExpirada } from "@/lib/sessao-expirada";
import {
  buscarConteudos,
  listarSubcategorias,
  listarTodasCategorias,
  mapaDeProgresso,
  sugestoesIniciais,
} from "@/lib/queries";
import { iconeDaCategoria } from "@/lib/icones-categoria";
import { CardConteudo } from "@/components/card-conteudo";
import { CampoBusca } from "@/components/campo-busca";
import { FiltrosBusca } from "@/components/filtros-busca";
import { Paginacao } from "@/components/paginacao";
import type {
  Categoria,
  Conteudo,
  Subcategoria,
  TipoConteudo,
} from "@/types/api";

export const metadata: Metadata = { title: "Buscar" };

/** Mesmo tamanho das páginas de tipo: 3 linhas cheias na grade de 4. */
const POR_PAGINA = 12;

const FILTROS: { rotulo: string; valor?: TipoConteudo }[] = [
  { rotulo: "Tudo" },
  { rotulo: "MasterClass", valor: "AULA" },
  { rotulo: "Cursos", valor: "CURSO" },
  { rotulo: "Palestras", valor: "PALESTRA" },
  { rotulo: "Podcasts", valor: "PODCAST" },
];

export default async function Buscar({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tipo?: string;
    pagina?: string;
    categoriaId?: string;
    subcategoriaId?: string;
  }>;
}) {
  const { q, tipo, pagina, categoriaId, subcategoriaId } = await searchParams;
  const termo = q?.trim() ?? "";
  const tipoValido = FILTROS.find((f) => f.valor === tipo)?.valor;
  const paginaAtual = Math.max(1, Number(pagina) || 1);
  const categoria = Number(categoriaId) || undefined;
  const subcategoria = Number(subcategoriaId) || undefined;

  const [categorias, subcategorias, progresso] = await Promise.all([
    listarTodasCategorias(),
    listarSubcategorias(),
    mapaDeProgresso(),
  ]);

  /*
   * Sem termo a tela abria só com uma frase. Preenchemos com destaques para
   * que a busca já sirva de vitrine — quem chega aqui sem saber o que procurar
   * tem por onde começar em vez de encarar um vazio.
   */
  if (termo.length === 0) {
    const sugestoes = await sugestoesIniciais(POR_PAGINA);

    return (
      <Moldura
        termo=""
        tipoAtivo={undefined}
        categorias={categorias ?? []}
        subcategorias={subcategorias ?? []}
      >
        <div className="flex flex-col gap-8 sm:gap-10">
          {/*
            Categorias vêm antes dos destaques: quem abre "Explorar" sem digitar
            nada está navegando por assunto, não procurando um título. Elas já
            eram carregadas para os filtros — aqui é a mesma lista, sem chamada
            extra à API.
          */}
          {(categorias ?? []).length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-texto font-display text-lg font-semibold tracking-tight">
                  Categorias
                </h2>
                <p className="text-texto-3 text-sm">
                  Navegue pelo acervo por assunto.
                </p>
              </div>

              <ul className="xs:grid-cols-2 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {(categorias ?? []).map((categoria) => (
                  <li key={categoria.id}>
                    <Link
                      href={`/categoria/${categoria.id}`}
                      className="border-borda-suave bg-superficie hover:border-acento/60 hover:bg-superficie-2 ease-suave group flex h-full items-center gap-3 rounded-xl border p-4 transition-[border-color,background-color,transform] duration-200 active:scale-[0.98]"
                    >
                      <span
                        aria-hidden="true"
                        className="bg-acento-claro/15 text-acento-claro flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      >
                        <svg
                          viewBox="0 0 20 20"
                          className="h-4.5 w-4.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {iconeDaCategoria(categoria.nome)}
                        </svg>
                      </span>
                      <span className="group-hover:text-acento text-sm leading-snug font-semibold transition-colors">
                        {categoria.nome}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {sugestoes.length === 0 ? (
            <p className="text-texto-3 text-sm">
              Digite algo acima para encontrar aulas, palestras e podcasts.
            </p>
          ) : (
            <section className="flex flex-col gap-4 sm:gap-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-texto font-display text-lg font-semibold tracking-tight">
                  Em destaque
                </h2>
                <p className="text-texto-3 text-sm">
                  Digite acima para buscar, ou comece por aqui.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
                {sugestoes.map((conteudo) => (
                  <CardConteudo
                    key={conteudo.id}
                    conteudo={conteudo}
                    largura="w-full"
                    progresso={progresso.get(conteudo.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
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
      categoriaId: categoria,
      subcategoriaId: subcategoria,
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
    <Moldura
      termo={termo}
      tipoAtivo={tipoValido}
      total={total}
      categorias={categorias ?? []}
      subcategorias={subcategorias ?? []}
      categoriaAtual={categoria}
      subcategoriaAtual={subcategoria}
    >
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
                progresso={progresso.get(conteudo.id)}
              />
            ))}
          </div>

          <Paginacao
            base="/buscar"
            pagina={paginaAtual}
            totalPaginas={totalPaginas}
            parametros={{
              q: termo,
              tipo: tipoValido,
              categoriaId: categoria ? String(categoria) : undefined,
              subcategoriaId: subcategoria ? String(subcategoria) : undefined,
            }}
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
  categorias,
  subcategorias,
  categoriaAtual,
  subcategoriaAtual,
  children,
}: {
  termo: string;
  tipoAtivo?: TipoConteudo;
  total?: number;
  categorias: Categoria[];
  subcategorias: Subcategoria[];
  categoriaAtual?: number;
  subcategoriaAtual?: number;
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
          <FiltrosBusca
            categorias={categorias}
            subcategorias={subcategorias}
            termo={termo}
            tipo={tipoAtivo}
            categoriaAtual={categoriaAtual}
            subcategoriaAtual={subcategoriaAtual}
          />
        )}

        {termo && (
          /* No celular os filtros deslizam na horizontal em vez de quebrar linha. */
          <div className="trilho -mx-5 flex items-center gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {FILTROS.map((filtro) => {
              const ativo = filtro.valor === tipoAtivo;
              const parametros = new URLSearchParams({ q: termo });
              if (filtro.valor) parametros.set("tipo", filtro.valor);
              if (categoriaAtual)
                parametros.set("categoriaId", String(categoriaAtual));
              if (subcategoriaAtual)
                parametros.set("subcategoriaId", String(subcategoriaAtual));

              return (
                <Link
                  key={filtro.rotulo}
                  href={`/buscar?${parametros.toString()}`}
                  className={`flex min-h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors duration-200 ${
                    ativo
                      ? "border-acento bg-acento text-white"
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
