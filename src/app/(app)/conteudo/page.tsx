import type { Metadata } from "next";
import {
  listarCategorias,
  listarConteudos,
  listarSubcategorias,
  mapaDeProgresso,
} from "@/lib/queries";
import { DESCRICAO_CONTEUDO, TIPOS_DE_CONTEUDO } from "@/lib/nav";
import { FAIXA } from "@/lib/ui";
import { CardConteudo } from "@/components/card-conteudo";
import { FiltrosBusca } from "@/components/filtros-busca";
import { Paginacao } from "@/components/paginacao";

/** 12 = três linhas cheias na grade de 4 colunas do desktop. */
const POR_PAGINA = 12;

export const metadata: Metadata = { title: "Conteúdo" };

/**
 * Acervo de aulas e palestras numa listagem só.
 *
 * Mora em `/conteudo`, ao lado de `/conteudo/{id}`: a lista e a ficha do que
 * está nela dividem o mesmo prefixo, que é o que a URL deveria dizer. O
 * podcast tem página própria porque não é listagem nenhuma — é um reprodutor
 * com playlist.
 */
export default async function PaginaConteudo({
  searchParams,
}: {
  searchParams: Promise<{
    pagina?: string;
    categoriaId?: string;
    subcategoriaId?: string;
  }>;
}) {
  const { pagina, categoriaId, subcategoriaId } = await searchParams;

  const paginaAtual = Math.max(1, Number(pagina) || 1);
  const categoria = Number(categoriaId) || undefined;
  const subcategoria = Number(subcategoriaId) || undefined;
  const comFiltro = Boolean(categoria || subcategoria);

  /*
   * Uma chamada por tipo: `/conteudos` e `/conteudos/categorias` filtram por
   * UM tipo, e esta página reúne dois. Só as categorias que têm conteúdo
   * daquele tipo voltam, e é isso que faz os filtros serem relevantes.
   */
  const [listasCategoria, subcategorias, acervos, progresso] = await Promise.all([
    Promise.all(TIPOS_DE_CONTEUDO.map((t) => listarCategorias(t))),
    listarSubcategorias(),
    // O acervo por tipo cabe numa página só (o maior tem 57 itens) e a
    // resposta é cacheada, então filtramos e paginamos aqui mesmo.
    Promise.all(TIPOS_DE_CONTEUDO.map((t) => listarConteudos({ tipo: t, limit: 200 }))),
    mapaDeProgresso(),
  ]);

  /*
   * As listas viram uma só, do mais novo ao mais antigo. Sem reordenar, a
   * página mostraria todas as aulas e só depois todas as palestras — a
   * emenda das duas chamadas ficaria à vista, e o acervo pareceria dividido
   * exatamente como esta tela se propõe a não dividir.
   */
  const reunidos = acervos
    .flatMap((lista) => lista.data)
    .sort((a, b) => Date.parse(b.dataCriacao) - Date.parse(a.dataCriacao));

  /*
   * O filtro é aplicado sobre a própria listagem: cada conteúdo já traz
   * `categoriaId` e `subcategoriaId`. Usar `/conteudos/search` traria um
   * recorte sem `videos`, e o card perderia a duração.
   */
  const filtrados = reunidos.filter((conteudo) => {
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

  /* Categorias das duas chamadas numa lista só, sem repetir as que se cruzam. */
  const porId = new Map<number, { id: number; nome: string }>();
  for (const lista of listasCategoria) {
    for (const c of lista?.data ?? []) porId.set(c.id, { id: c.id, nome: c.nome });
  }
  const categorias = [...porId.values()].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR"),
  );

  // Só as subcategorias das categorias que aparecem nesta página.
  const idsCategorias = new Set(categorias.map((c) => c.id));
  const subcategoriasDaPagina = (subcategorias ?? []).filter(
    (s) => s.categoriaId === undefined || idsCategorias.has(s.categoriaId),
  );

  return (
    <div className={`${FAIXA} flex flex-col gap-6 py-8 sm:gap-8 sm:py-10`}>
      <header className="flex flex-col gap-1.5 sm:gap-2">
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Conteúdo
        </h1>
        <p className="text-texto-3 text-sm">
          {DESCRICAO_CONTEUDO}
          {total > 0 && (
            <span className="tabular-nums">
              {" "}
              · {total} {comFiltro ? "nesta seleção" : "no acervo"}
            </span>
          )}
        </p>
      </header>

      {categorias.length > 0 && (
        <FiltrosBusca
          base="/conteudo"
          preservarTipo={false}
          categorias={categorias}
          subcategorias={subcategoriasDaPagina}
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

          <Paginacao
            base="/conteudo"
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
