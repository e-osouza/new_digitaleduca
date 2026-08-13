import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  listarCategorias,
  listarConteudos,
  listarSubcategorias,
  mapaDeProgresso,
} from "@/lib/queries";
import { ROTULOS_PLURAIS, TIPOS_NA_URL } from "@/lib/nav";
import { FAIXA } from "@/lib/ui";
import { CardConteudo } from "@/components/card-conteudo";
import { ItemPodcast } from "@/components/item-podcast";
import { FiltrosBusca } from "@/components/filtros-busca";
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
  searchParams: Promise<{
    pagina?: string;
    categoriaId?: string;
    subcategoriaId?: string;
  }>;
}) {
  const [{ tipo }, { pagina, categoriaId, subcategoriaId }] = await Promise.all([
    params,
    searchParams,
  ]);

  const chave = TIPOS_NA_URL[tipo];
  if (!chave) notFound();

  const paginaAtual = Math.max(1, Number(pagina) || 1);
  const categoria = Number(categoriaId) || undefined;
  const subcategoria = Number(subcategoriaId) || undefined;
  const comFiltro = Boolean(categoria || subcategoria);

  /*
   * `/conteudos/categorias?tipo=` devolve só as categorias que têm conteúdo
   * daquele tipo — é o que faz os filtros serem relevantes para cada página.
   */
  const [opcoesCategoria, subcategorias, acervo, progresso] = await Promise.all([
    listarCategorias(chave),
    listarSubcategorias(),
    // O acervo por tipo cabe numa página só (o maior tem 57 itens) e a
    // resposta é cacheada, então filtramos e paginamos aqui mesmo.
    listarConteudos({ tipo: chave, limit: 200 }),
    mapaDeProgresso(),
  ]);

  /*
   * O filtro é aplicado sobre a própria listagem: cada conteúdo já traz
   * `categoriaId` e `subcategoriaId`. Usar `/conteudos/search` traria um
   * recorte sem `videos`, e o card perderia a duração.
   */
  const filtrados = acervo.data.filter((conteudo) => {
    if (categoria && conteudo.categoriaId !== categoria) return false;
    if (subcategoria && conteudo.subcategoriaId !== subcategoria) return false;
    return true;
  });

  const total = filtrados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  // Trocar de filtro pode deixar a página atual além do fim da nova lista.
  const paginaValida = Math.min(paginaAtual, totalPaginas);
  const itens = filtrados.slice(
    (paginaValida - 1) * POR_PAGINA,
    paginaValida * POR_PAGINA,
  );

  const categoriasDoTipo = (opcoesCategoria?.data ?? []).map((c) => ({
    id: c.id,
    nome: c.nome,
  }));

  // Só as subcategorias das categorias que aparecem nesta página.
  const idsCategorias = new Set(categoriasDoTipo.map((c) => c.id));
  const subcategoriasDoTipo = (subcategorias ?? []).filter(
    (s) => s.categoriaId === undefined || idsCategorias.has(s.categoriaId),
  );

  return (
    <div className={`${FAIXA} flex flex-col gap-6 py-8 sm:gap-8 sm:py-10`}>
      <header className="flex flex-col gap-1.5 sm:gap-2">
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          {ROTULOS_PLURAIS[chave]}
        </h1>
        <p className="text-texto-3 text-sm">
          {DESCRICOES[chave]}
          {total > 0 && (
            <span className="tabular-nums">
              {" "}
              · {total} {comFiltro ? "nesta seleção" : "no acervo"}
            </span>
          )}
        </p>
      </header>

      {categoriasDoTipo.length > 0 && (
        <FiltrosBusca
          base={`/tipo/${tipo}`}
          preservarTipo={false}
          categorias={categoriasDoTipo}
          subcategorias={subcategoriasDoTipo}
          categoriaAtual={categoria}
          subcategoriaAtual={subcategoria}
        />
      )}

      {itens.length === 0 ? (
        <p className="text-texto-3 text-sm">
          {comFiltro
            ? "Nenhum conteúdo nesta combinação de filtros."
            : "Nenhum conteúdo publicado nesta categoria ainda."}
        </p>
      ) : (
        <>
          {/*
            Podcast tem layout próprio: episódio único de ~20 min com o
            convidado no título. A grade de pôsteres serve a curso e palestra,
            não a um feed de entrevistas.
          */}
          {chave === "PODCAST" ? (
            <ul className="flex flex-col gap-3">
              {itens.map((conteudo) => (
                <li key={conteudo.id}>
                  <ItemPodcast
                    conteudo={conteudo}
                    progresso={progresso.get(conteudo.id)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
              {itens.map((conteudo) => (
                <CardConteudo
                  key={conteudo.id}
                  conteudo={conteudo}
                  largura="w-full"
                  progresso={progresso.get(conteudo.id)}
                />
              ))}
            </div>
          )}

          <Paginacao
            base={`/tipo/${tipo}`}
            pagina={paginaValida}
            totalPaginas={totalPaginas}
            parametros={{
              categoriaId: categoria ? String(categoria) : undefined,
              subcategoriaId: subcategoria ? String(subcategoria) : undefined,
            }}
          />
        </>
      )}
    </div>
  );
}
