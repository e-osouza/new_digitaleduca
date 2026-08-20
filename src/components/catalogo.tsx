import Image from "next/image";
import Link from "next/link";
import {
  configPublica,
  listarConteudos,
  listarTodasCategorias,
  listarInstrutores,
  listarPropagandas,
  maisAssistidosSemPodcast,
  mapaDeProgresso,
  paraCard,
  progressoEmAndamento,
} from "@/lib/queries";
import {
  capaDoConteudo,
  duracaoTotal,
  formatarDuracao,
  resumir,
  rotuloTipo,
} from "@/lib/format";
import { CardConteudo } from "@/components/card-conteudo";
import { rotaDoEpisodio } from "@/lib/podcast";
import { Trilho } from "@/components/trilho";
import { iconeDaCategoria } from "@/lib/icones-categoria";
import { HeroiSlide } from "@/components/heroi-slide";
import { Propagandas } from "@/components/propagandas";

/** Home de quem já entrou: catálogo completo em trilhos. */
export async function Catalogo() {
  /*
   * Tudo numa leva só. As categorias e o progresso ficavam em `await` próprios
   * depois deste bloco, o que transformava a home em quatro idas sequenciais à
   * API — cada uma esperando a anterior sem precisar de nada dela.
   *
   * `progressoEmAndamento` e `mapaDeProgresso` são o MESMO pedido: o segundo é
   * derivado do primeiro e ambos são memoizados por requisição.
   */
  const [
    destaques,
    maisAssistidos,
    aulas,
    palestras,
    podcasts,
    instrutores,
    listaCategorias,
    // Já vem com título, capas e duração — sem precisar cruzar com o catálogo.
    emAndamento,
    /*
     * Mesmo dado do trilho de continuação, indexado por conteúdo: é o que marca
     * com a barra os cards que se repetem nos demais trilhos.
     */
    progresso,
    propagandas,
    config,
  ] = await Promise.all([
    listarConteudos({ destaque: true, limit: 12 }),
    maisAssistidosSemPodcast(10),
    listarConteudos({ tipo: "AULA", limit: 12 }),
    listarConteudos({ tipo: "PALESTRA", limit: 12 }),
    listarConteudos({ tipo: "PODCAST", limit: 12 }),
    listarInstrutores(14),
    listarTodasCategorias(),
    progressoEmAndamento(),
    mapaDeProgresso(),
    listarPropagandas(),
    configPublica(),
  ]);

  const categorias = listaCategorias ?? [];
  const continuar = emAndamento.slice(0, 10);

  /*
   * Até 3 destaques viram slides do topo; o restante segue no trilho abaixo,
   * para não repetir os mesmos conteúdos nas duas áreas.
   */
  const paraSlide = (
    /*
     * A chave do painel admin (`slideDestaqueAtivo`) é a única forma de tirar
     * o carrossel do ar: sem ela, uma lista de destaques vazia apenas faz o
     * slide cair para os mais assistidos, e ele continua no topo.
     */
    !config.slideDestaqueAtivo
      ? []
      : destaques.data.length > 0
        ? destaques.data
        : maisAssistidos
  )
    .slice(0, 3)
    .map((conteudo) => {
      const segundos = duracaoTotal(conteudo);
      return {
        id: conteudo.id,
        titulo: conteudo.titulo,
        descricao: conteudo.descricao ? resumir(conteudo.descricao, 220) : null,
        capa: conteudo.thumbnailDestaque ?? capaDoConteudo(conteudo),
        href:
          conteudo.tipo === "PODCAST"
            ? rotaDoEpisodio(conteudo.id)
            : `/conteudo/${conteudo.id}`,
        tipo: rotuloTipo(conteudo.tipo),
        duracao: segundos > 0 ? formatarDuracao(segundos) : null,
        instrutor: conteudo.instrutores?.[0]?.instrutor?.nome ?? null,
      };
    });

  const idsNoSlide = new Set(paraSlide.map((slide) => slide.id));
  const outrosDestaques = destaques.data.filter((c) => !idsNoSlide.has(c.id));

  return (
    <div className="flex flex-col gap-10 pb-8 sm:gap-14">
      {/*
        Herói e banner ficam num grupo SEM gap — juntos eles contam como um
        filho só do empilhamento acima. O respiro entre os dois é a margem que
        o próprio banner carrega (`--calha`, a mesma medida da calha lateral),
        e não o gap-14 da home: os dois somados davam 96px, o dobro do que
        separa qualquer outro par de blocos daqui para baixo.
      */}
      <div className="flex flex-col">
        <HeroiSlide slides={paraSlide} />
        <Propagandas itens={propagandas} />
      </div>

      {continuar.length > 0 && (
        <Trilho
          titulo="Continue de onde parou"
          verMais={{ href: "/meus-conteudos", rotulo: "Ver tudo" }}
        >
          {continuar.map((item, indice) => (
            <CardConteudo
              key={item.conteudoId}
              conteudo={paraCard(item)}
              /*
               * Os dois primeiros abrem a tela logo abaixo do herói e são
               * candidatos a LCP — ver `prioritaria` em CardConteudo.
               */
              prioritaria={indice < 2}
              progresso={item.percentualAssistido}
              duracaoSegundos={item.duracao}
              /*
               * Abre já reproduzindo. Para aula e palestra isso é a ficha com
               * `?assistir=1`, que sobe o vídeo em tela cheia; para podcast é a
               * própria tela do podcast, que retoma o episódio de onde parou.
               */
              href={
                item.tipo === "PODCAST"
                  ? rotaDoEpisodio(item.conteudoId)
                  : `/conteudo/${item.conteudoId}?assistir=1`
              }
              orientacao="horizontal"
              largura="card-trilho-largo"
            />
          ))}
        </Trilho>
      )}

      {outrosDestaques.length > 0 && (
        <Trilho titulo="Em destaque" descricao="Selecionados pela curadoria">
          {outrosDestaques.map((conteudo, indice) => (
            <CardConteudo
              key={conteudo.id}
              conteudo={conteudo}
              /*
               * Para quem ainda não assistiu nada, "Continue de onde parou"
               * não existe e este é o primeiro trilho da página.
               */
              prioritaria={continuar.length === 0 && indice < 2}
              progresso={progresso.get(conteudo.id)}
            />
          ))}
        </Trilho>
      )}

      {/*
        Sem "ver mais": o trilho já é a lista inteira, não um recorte dela. O
        `slice` garante os 10 mesmo se o endpoint passar a devolver mais.
      */}
      {maisAssistidos.length > 0 && (
        <Trilho titulo="Conteúdos mais assistidos">
          {maisAssistidos.map((conteudo, indice) => (
            <CardConteudo
              key={conteudo.id}
              conteudo={conteudo}
              progresso={progresso.get(conteudo.id)}
              numero={indice + 1}
            />
          ))}
        </Trilho>
      )}

      {aulas.data.length > 0 && (
        <Trilho
          titulo="Aulas"
          descricao="Cursos e super aulas para aplicar no dia a dia"
          verMais={{ href: "/conteudo", rotulo: "Ver todas" }}
        >
          {aulas.data.map((conteudo) => (
            <CardConteudo
              key={conteudo.id}
              conteudo={conteudo}
              progresso={progresso.get(conteudo.id)}
            />
          ))}
        </Trilho>
      )}

      {palestras.data.length > 0 && (
        <Trilho
          titulo="Palestras"
          descricao="Replays de quem já escalou empresas"
          verMais={{ href: "/conteudo", rotulo: "Ver todas" }}
        >
          {palestras.data.map((conteudo) => (
            <CardConteudo
              key={conteudo.id}
              conteudo={conteudo}
              progresso={progresso.get(conteudo.id)}
            />
          ))}
        </Trilho>
      )}

      {podcasts.data.length > 0 && (
        <Trilho
          titulo="Podcasts"
          descricao="Conversas com quem faz acontecer"
          verMais={{ href: "/tipo/podcast", rotulo: "Ver todos" }}
        >
          {podcasts.data.map((conteudo) => (
            <CardConteudo
              key={conteudo.id}
              conteudo={conteudo}
              largura="card-trilho-quadrado"
              progresso={progresso.get(conteudo.id)}
            />
          ))}
        </Trilho>
      )}

      {categorias.length > 0 && (
        <Trilho titulo="Categorias" descricao="Navegue pelo acervo por assunto">
          {categorias.map((categoria) => (
            <Link
              key={categoria.id}
              href={`/categoria/${categoria.id}`}
              className="border-borda-suave bg-superficie hover:border-acento/60 hover:bg-superficie-2 ease-suave group card-trilho-estreito flex flex-col items-center gap-2.5 rounded-xl border p-3 text-center transition-[border-color,background-color,transform] duration-200 active:scale-[0.98] sm:gap-3 sm:p-4"
            >
              <span
                aria-hidden="true"
                className="bg-acento-claro/15 text-acento-claro flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11"
              >
                <svg
                  viewBox="0 0 20 20"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {iconeDaCategoria(categoria.nome)}
                </svg>
              </span>
              {/*
                Centrado e em coluna: a caixa larga anterior (192px fixos) não
                cabe em três colunas de celular, e nome comprido como "Captação
                de recursos" precisa das duas linhas.
              */}
              <span className="group-hover:text-acento line-clamp-2 text-xs leading-snug font-semibold transition-colors sm:text-sm">
                {categoria.nome}
              </span>
            </Link>
          ))}
        </Trilho>
      )}

      {instrutores.length > 0 && (
        <Trilho titulo="Especialistas" descricao="Quem ensina na plataforma">
          {instrutores.map((instrutor) => (
            <Link
              key={instrutor.id}
              href={`/instrutor/${instrutor.id}`}
              className="border-borda-suave bg-superficie hover:border-acento/60 ease-suave card-trilho-estreito flex flex-col items-center gap-2.5 rounded-xl border p-3 text-center transition-[border-color,transform] duration-200 active:scale-[0.98] sm:gap-3 sm:p-4"
            >
              <div className="bg-superficie-2 relative h-14 w-14 shrink-0 overflow-hidden rounded-full sm:h-16 sm:w-16 lg:h-20 lg:w-20">
                {instrutor.avatar ? (
                  <Image
                    src={instrutor.avatar}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 56px, 80px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-texto-3 flex h-full items-center justify-center text-xl font-semibold">
                    {instrutor.nome.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <p className="line-clamp-2 text-xs leading-snug font-semibold sm:text-sm">
                  {instrutor.nome}
                </p>
                {/* A formação não cabe legível nos ~100px do celular. */}
                {instrutor.formacao && (
                  <p className="text-texto-3 line-clamp-2 hidden text-xs leading-snug sm:block">
                    {instrutor.formacao}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </Trilho>
      )}
    </div>
  );
}
