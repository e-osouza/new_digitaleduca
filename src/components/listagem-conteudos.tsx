import {
  listarCategorias,
  listarConteudos,
  listarSubcategorias,
  mapaDeProgresso,
} from "@/lib/queries";
import { FAIXA } from "@/lib/ui";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CardConteudo } from "@/components/card-conteudo";
import { EstadoVazio } from "@/components/estado-vazio";
import { IlustracaoSemConteudo } from "@/components/ilustracoes";
import { FiltrosBusca } from "@/components/filtros-busca";
import { Paginacao } from "@/components/paginacao";
import type { TipoConteudo } from "@/types/api";

/** 12 = três linhas cheias na grade de 4 colunas do desktop. */
const POR_PAGINA = 12;

/**
 * Listagem de um tipo de conteúdo, com filtros e paginação.
 *
 * Uma só implementação para Cursos e MasterClass: as duas telas diferem
 * apenas no tipo, no título e na frase de apoio. Podcast NÃO passa por aqui —
 * não é listagem, é um reprodutor com playlist.
 *
 * O tipo é o VALOR do contrato da API (`AULA`, `CURSO`); o título é o rótulo
 * de produto ("MasterClass"). Os dois mudam por motivos diferentes e em ritmos
 * diferentes, então quem chama informa os dois.
 */
export async function ListagemConteudos({
  tipo,
  titulo,
  descricao,
  base,
  pagina,
  categoriaId,
  subcategoriaId,
}: {
  tipo: TipoConteudo;
  titulo: string;
  descricao: string;
  /** Caminho desta listagem — vira a base dos filtros e da paginação. */
  base: string;
  pagina?: string;
  categoriaId?: string;
  subcategoriaId?: string;
}) {
  const paginaAtual = Math.max(1, Number(pagina) || 1);
  const categoria = Number(categoriaId) || undefined;
  const subcategoria = Number(subcategoriaId) || undefined;
  const comFiltro = Boolean(categoria || subcategoria);

  /*
   * A API pagina e filtra — pedimos só os 12 desta página.
   *
   * Antes esta tela pedia o acervo inteiro (`limit: 200`, ~120 KB) e recortava
   * em memória, porque `/conteudos` ignorava `categoriaId`. Passou a aceitar
   * em 24/08/2026, e a diferença é grande: 22 KB no lugar de 120 KB, e o custo
   * deixa de crescer com o tamanho do catálogo.
   *
   * `/conteudos/categorias?tipo=` devolve só as categorias que têm conteúdo
   * daquele tipo — é o que faz os filtros serem relevantes para cada tela.
   */
  const [opcoesCategoria, subcategorias, acervo, progresso] = await Promise.all([
    listarCategorias(tipo),
    listarSubcategorias(),
    listarConteudos({
      tipo,
      categoriaId: categoria,
      subcategoriaId: subcategoria,
      page: paginaAtual,
      limit: POR_PAGINA,
    }),
    mapaDeProgresso(),
  ]);

  const total = acervo.pagination?.total ?? acervo.data.length;
  const totalPaginas = Math.max(
    1,
    acervo.pagination?.totalPages ?? Math.ceil(total / POR_PAGINA),
  );
  /*
   * Página além do fim: manda de volta para a última que existe.
   *
   * Acontece ao apertar um filtro estando na página 5. Antes o recorte em
   * memória devolvia a última página sozinho; agora a API responde uma lista
   * vazia, que a tela leria como "nada nesta combinação" — uma mentira, já que
   * há conteúdo, só não naquela página. O redirecionamento também conserta a
   * URL, em vez de deixá-la apontando para o vazio.
   */
  if (total > 0 && paginaAtual > totalPaginas) {
    const busca = new URLSearchParams();
    if (totalPaginas > 1) busca.set("pagina", String(totalPaginas));
    if (categoria) busca.set("categoriaId", String(categoria));
    if (subcategoria) busca.set("subcategoriaId", String(subcategoria));
    const cauda = busca.toString();
    redirect(cauda ? `${base}?${cauda}` : base);
  }

  const paginaValida = Math.min(paginaAtual, totalPaginas);
  const itens = acervo.data;

  const categorias = (opcoesCategoria?.data ?? []).map((c) => ({
    id: c.id,
    nome: c.nome,
  }));

  // Só as subcategorias das categorias que aparecem nesta página.
  const idsCategorias = new Set(categorias.map((c) => c.id));
  const subcategoriasDaPagina = (subcategorias ?? []).filter(
    (s) => s.categoriaId === undefined || idsCategorias.has(s.categoriaId),
  );

  /*
   * Acervo vazio e SEM filtro: a tela inteira vira o estado vazio, como em
   * /trilhas. Manter o cabeçalho e os filtros aqui seria enfeitar o nada —
   * não há o que filtrar, e o <h1> ficaria sozinho no topo de uma página em
   * branco. Com filtro é outra história: ver abaixo.
   */
  if (total === 0 && !comFiltro) {
    return (
      <div className={`${FAIXA} flex flex-1 flex-col py-8 sm:py-10`}>
        <EstadoVazio
          ilustracao={<IlustracaoSemConteudo />}
          titulo={titulo}
          descricao={`${descricao} Nada foi publicado ainda — assim que o primeiro sair, ele aparece aqui.`}
        >
          <Link
            href="/inicio"
            className="bg-acento text-white hover:bg-acento-hover flex min-h-11 items-center rounded-full px-6 text-sm font-bold transition-colors"
          >
            Explorar o catálogo
          </Link>
        </EstadoVazio>
      </div>
    );
  }

  return (
    <div className={`${FAIXA} flex flex-col gap-6 py-8 sm:gap-8 sm:py-10`}>
      <header className="flex flex-col gap-1.5 sm:gap-2">
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          {titulo}
        </h1>
        <p className="text-texto-3 text-sm">
          {descricao}
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
          base={base}
          preservarTipo={false}
          categorias={categorias}
          subcategorias={subcategoriasDaPagina}
          categoriaAtual={categoria}
          subcategoriaAtual={subcategoria}
        />
      )}

      {itens.length === 0 ? (
        /*
         * Aqui o acervo TEM conteúdo — quem esvaziou a tela foi o filtro. O
         * cabeçalho e os seletores seguem em cena, então o título deste bloco
         * é `secao`: um segundo <h1> na mesma página seria erro de estrutura.
         * E a ação que resolve não é "explorar o catálogo", é afrouxar o
         * filtro, que já está logo acima.
         */
        <EstadoVazio
          nivel="secao"
          ilustracao={<IlustracaoSemConteudo />}
          titulo="Nada nesta combinação"
          descricao="Nenhum conteúdo atende aos filtros escolhidos. Tente uma categoria mais ampla."
        >
          <Link
            href={base}
            className="border-borda text-texto hover:border-acento/60 hover:bg-superficie-2 flex min-h-11 items-center rounded-full border px-6 text-sm font-semibold transition-colors"
          >
            Limpar filtros
          </Link>
        </EstadoVazio>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {itens.map((conteudo, indice) => (
              <CardConteudo
                key={conteudo.id}
                conteudo={conteudo}
                largura="w-full"
                /* Os dois primeiros abrem a tela e são candidatos a LCP. */
                prioritaria={paginaValida === 1 && indice < 2}
                progresso={progresso.get(conteudo.id)}
              />
            ))}
          </div>

          <Paginacao
            base={base}
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
