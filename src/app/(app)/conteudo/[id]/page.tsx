import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api";
import { encerrarSessaoExpirada } from "@/lib/sessao-expirada";
import {
  fichaPelaListagem,
  listarConteudos,
  listarSalvos,
  mapaDeProgresso,
  obterConteudo,
  recomendados,
} from "@/lib/queries";
import {
  capaDoConteudo,
  capaVertical,
  duracaoTotal,
  emTopicos,
  estaLiberado,
  extrairVimeoId,
  formatarData,
  formatarDuracao,
  resumir,
  rotuloTipo,
} from "@/lib/format";
import { separarTitulo } from "@/lib/podcast";
import { CardConteudo } from "@/components/card-conteudo";
import { ItemPodcast } from "@/components/item-podcast";
import { ListaAulas } from "@/components/lista-aulas";
import { Trilho } from "@/components/trilho";
import { Selo } from "@/components/selo";
import { SemAcesso } from "@/components/sem-acesso";
import { BotaoSalvar } from "@/components/botao-salvar";
import { BotaoAssistir } from "@/components/botao-assistir";
import { ProvedorPlayerConteudo } from "@/components/player-conteudo";
import type { AulaDoModal } from "@/components/modal-player";
import type { Conteudo, Envelope, Video } from "@/types/api";

/**
 * Episódios na lateral. O resto fica atrás do "Ver todos".
 *
 * Quatro mantêm a coluna do tamanho da principal — que no podcast tem só a
 * descrição, o convidado e os detalhes. Uma lista longa aqui ultrapassaria o
 * conteúdo e desequilibraria a página.
 */
const LATERAL_EPISODIOS = 4;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const conteudo = await obterConteudo(Number(id));
    return {
      title: conteudo.titulo,
      description: resumir(conteudo.descricao, 155),
    };
  } catch {
    return { title: "Conteúdo" };
  }
}

export default async function PaginaConteudo({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ assistir?: string }>;
}) {
  const [{ id }, { assistir }] = await Promise.all([params, searchParams]);
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  /*
   * `bloqueado` = a API recusou o detalhe por falta de assinatura.
   *
   * Mesmo assim a ficha é exibida: quem ainda não assina precisa entender do
   * que trata o curso para decidir assinar. O detalhe vem então da listagem,
   * que não faz essa checagem, e a página entra em modo prévia — o botão de
   * reproduzir vira um convite à assinatura, e a lista de aulas perde os links.
   */
  /*
   * Disparadas ANTES do detalhe: nenhuma delas depende dele, só do id que já
   * veio da URL. Esperar `obterConteudo` resolver para então pedir estas quatro
   * fazia a página abrir em duas idas sequenciais à API em vez de uma.
   *
   * O acervo de podcasts é o único usado condicionalmente. Pedi-lo sempre custa
   * uma chamada pública cacheada por 300s — na prática uma leitura do Data
   * Cache — e poupa a ida extra justamente nas páginas em que ele importa.
   *
   * Nenhuma das quatro rejeita (as três primeiras são `apiOpcional`, a última
   * leva `catch`), então elas podem ficar pendentes se o detalhe abaixo cair
   * num `notFound` sem virar unhandled rejection.
   */
  const recomendacoesPendente = recomendados(numero, 12);
  const salvosPendente = listarSalvos();
  const progressoPendente = mapaDeProgresso();
  const acervoPodcastsPendente = listarConteudos({
    tipo: "PODCAST",
    limit: 200,
  }).catch(() => null);

  let conteudo: Conteudo;
  let bloqueado = false;

  try {
    conteudo = await obterConteudo(numero);
  } catch (erro) {
    if (!(erro instanceof ApiError)) throw erro;
    if (erro.naoAutenticado) encerrarSessaoExpirada(`/conteudo/${numero}`);
    if (erro.naoEncontrado) notFound();
    if (!erro.semAssinatura) throw erro;

    const ficha = await fichaPelaListagem(numero);
    // Sem nem a listagem devolver, não há o que mostrar além do bloqueio.
    if (!ficha) return <SemAcesso />;

    conteudo = ficha;
    bloqueado = true;
  }

  /*
   * Podcast tem tratamento próprio: no acervo é sempre um episódio único de
   * ~20 min, e o título já vem como "Convidado — Tema". O andaime de curso
   * (aprendizagem, lista de aulas) não descreve isso.
   */
  const ehPodcast = conteudo.tipo === "PODCAST";
  const { convidado, tema } = separarTitulo(conteudo.titulo);

  const capa = conteudo.thumbnailDestaque ?? capaDoConteudo(conteudo);
  // A arte em pé (850×971) é a que recorta bem em quadrado na capa do episódio.
  const capaVerticalDoPodcast = ehPodcast ? capaVertical(conteudo) : null;
  const duracao = duracaoTotal(conteudo);
  const liberado = estaLiberado(conteudo);
  const aulas = listarAulas(conteudo);
  const primeiraAula = aulas[0];
  const aprendizagem = emTopicos(conteudo.aprendizagem);

  /*
   * Aulas prontas para o modal, com o módulo de cada uma — é o que alimenta a
   * lista lateral. Só entram as que têm id de Vimeo; sem ele não há o que
   * tocar, e um item morto na lista seria pior que a ausência.
   */
  const aulasDoModal = montarAulasDoModal(conteudo);
  const aulaInicial = aulaParaRetomar(aulasDoModal);
  const retomando = Boolean(aulaInicial && aulaInicial.id !== aulasDoModal[0]?.id) ||
    Boolean(aulaInicial?.segundosIniciais);

  const rotuloAssistir = ehPodcast
    ? "Ouvir agora"
    : retomando
      ? "Continuar assistindo"
      : aulas.length > 1
        ? "Começar a primeira aula"
        : "Assistir";
  const [recomendacoes, salvos, progresso, acervoPodcasts] =
    await Promise.all([
      // Podcast não usa recomendação: a lista sai do acervo do próprio tipo.
      ehPodcast ? null : recomendacoesPendente,
      salvosPendente,
      progressoPendente,
      ehPodcast ? acervoPodcastsPendente : null,
    ]);

  /*
   * "Mais episódios" vem do acervo de podcasts, e não de `recomendados`: aquele
   * endpoint mistura tipos, e uma aula desenhada com o card de episódio teria o
   * título quebrado em "convidado — tema" sem que isso signifique nada.
   *
   * Também rende mais itens — são 18 podcasts no acervo contra os 12 que a
   * recomendação devolvia, já misturados.
   */
  const outrosEpisodios = (acervoPodcasts?.data ?? []).filter(
    (episodio) => episodio.id !== numero,
  );

  /*
   * Os cards usam a arte vertical, que é justamente o que
   * `findRecomendados` devolve (`thumbnailMobile`). O cruzamento com o
   * catálogo para buscar a versão horizontal deixou de ser necessário.
   */
  const relacionados = normalizarRecomendados(recomendacoes);

  // O id do vínculo é o que a API usa para remover dos salvos.
  const vinculoNaLista =
    salvos.find((item) => item.conteudo?.id === numero)?.id ?? null;

  /*
   * O provedor precisa envolver a capa (onde fica "Assistir agora") E o corpo
   * (onde fica a lista de aulas): é o que faz os dois abrirem o MESMO player.
   *
   * Sem aula com vídeo não há player nenhum, e a página sai sem o provedor —
   * `usePlayerConteudo` devolve null e a lista volta a ser link comum.
   */
  const corpo = (
    <div className="flex flex-col gap-10 pb-8 sm:gap-14">
      {/* ---- capa ---- */}
      <section className="relative min-h-[300px] overflow-hidden sm:min-h-[380px] lg:min-h-[440px]">
        {capa && (
          <Image
            src={capa}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        )}
        <div className="veu-heroi absolute inset-0" />

        <div className="sobre-capa calha relative flex w-full flex-col justify-end gap-4 pt-20 pb-8 sm:gap-5 sm:pt-24 sm:pb-10">
          <div className="flex flex-wrap items-center gap-2">
            <Selo variacao="acento">{rotuloTipo(conteudo.tipo)}</Selo>
            {duracao > 0 && <Selo>{formatarDuracao(duracao)}</Selo>}
            {liberado && <Selo variacao="gratis">Grátis</Selo>}
            {aulas.length > 1 && <Selo>{aulas.length} aulas</Selo>}
          </div>

          {ehPodcast ? (
            <div className="flex items-end gap-5">
              {/* Capa quadrada, convenção do formato — a arte já é quase 1:1. */}
              {capaVerticalDoPodcast && (
                <div className="ring-borda-suave/30 relative hidden aspect-square w-28 shrink-0 overflow-hidden rounded-xl ring-1 sm:block lg:w-36">
                  <Image
                    src={capaVerticalDoPodcast}
                    alt=""
                    fill
                    sizes="144px"
                    className="object-cover"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <h1 className="font-display max-w-3xl text-3xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-4xl">
                  {convidado}
                </h1>
                {tema && (
                  <p className="text-texto-2 max-w-2xl text-base leading-snug text-pretty sm:text-lg">
                    {tema}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-display max-w-3xl text-3xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-4xl">
                {conteudo.titulo}
              </h1>

              {conteudo.instrutores.length > 0 && (
                <p className="text-texto-3 text-sm">
                  com{" "}
                  <span className="text-texto-2 font-medium">
                    {conteudo.instrutores.map((i) => i.instrutor.nome).join(", ")}
                  </span>
                </p>
              )}
            </>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {primeiraAula &&
              (bloqueado || !aulaInicial ? (
                <Link
                  /*
                   * Bloqueado, o destino é a reprodução: é lá que a tela de
                   * conteúdo exclusivo explica o porquê e oferece os planos.
                   * Sem id de Vimeo também caímos aqui, onde a página de
                   * assistir mostra o aviso de aula sem vídeo vinculado.
                   */
                  href={`/assistir/${conteudo.id}?aula=${primeiraAula.id}`}
                  className="bg-acento text-white hover:bg-acento-hover inline-flex min-h-11 items-center gap-2 rounded-full px-6 text-sm font-bold transition-colors"
                >
                  {bloqueado ? (
                    <>
                      <svg
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="4" y="8.5" width="12" height="8" rx="2" />
                        <path d="M6.75 8.5V6a3.25 3.25 0 0 1 6.5 0v2.5" />
                      </svg>
                      Assinar para assistir
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill="currentColor"
                      >
                        <path d="M4 2.5v11l9-5.5-9-5.5Z" />
                      </svg>
                      {rotuloAssistir}
                    </>
                  )}
                </Link>
              ) : (
                <BotaoAssistir rotulo={rotuloAssistir} />
              ))}

            <BotaoSalvar conteudoId={conteudo.id} salvoId={vinculoNaLista} />
          </div>
        </div>
      </section>

      {/* ---- corpo ---- */}
      {/*
        A lateral do podcast é mais larga: ela carrega cards de episódio, com
        capa e duas linhas de texto, e não a ficha curta dos outros tipos.
      */}
      <div
        className={`calha grid w-full gap-10 lg:gap-12 ${
          ehPodcast
            ? "lg:grid-cols-[minmax(0,1fr)_420px]"
            : "lg:grid-cols-[minmax(0,1fr)_320px]"
        }`}
      >
        <div className="flex flex-col gap-8 sm:gap-10">
          {conteudo.descricao && (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-xl font-semibold">Sobre</h2>
              <p className="text-texto-2 leading-relaxed whitespace-pre-line">
                {conteudo.descricao}
              </p>
            </section>
          )}

          {!ehPodcast && aprendizagem.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-xl font-semibold">
                O que você vai aprender
              </h2>
              <ul className="flex flex-col gap-2.5">
                {aprendizagem.map((item, indice) => (
                  <li key={indice} className="text-texto-2 flex gap-3 text-sm leading-relaxed">
                    <span aria-hidden="true" className="text-acento mt-0.5 shrink-0">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {ehPodcast && (
            <>
              <BlocoInstrutores conteudo={conteudo} ehPodcast />
              <BlocoDetalhes conteudo={conteudo} duracao={duracao} />
            </>
          )}

          {!ehPodcast && aulas.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="font-display text-xl font-semibold">
                Conteúdo
                <span className="text-texto-3 ml-2 text-sm font-normal tabular-nums">
                  {aulas.length} {aulas.length === 1 ? "aula" : "aulas"}
                </span>
              </h2>
              <ListaAulas conteudo={conteudo} />
            </section>
          )}
        </div>

        {/* ---- lateral ---- */}
        {/*
          A lateral acompanha a rolagem a partir de `lg`. A coluna principal é
          bem mais alta que ela — a lista de aulas costuma passar de uma tela —
          e sem isto a ficha saía de vista logo no começo, deixando meia página
          de espaço vazio à direita. Abaixo de `lg` não há duas colunas: a
          lateral vira o fim da página, e grudar não faria sentido.

          `self-start` é o que faz o `sticky` funcionar: como item de grade, o
          `<aside>` estica até a altura da linha por padrão, e um elemento que
          preenche a própria área não tem folga para deslizar dentro dela.

          O teto de altura cobre a tela baixa, onde a ficha inteira não caberia
          — sem ele o pé dela ficaria preso fora do campo de visão. Desconta o
          cabeçalho do AppShell (4rem) mais as folgas de topo e de base. A calha
          de 4px (`px-1 -mx-1`) existe porque a rolagem própria recorta na
          borda: sem ela o anel de foco dos cards seria cortado.
        */}
        <aside className="flex flex-col gap-8 lg:sticky lg:top-6 lg:-mx-1 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto lg:px-1">
          {/*
            No podcast a lateral recebe os outros episódios: com um único
            vídeo, instrutor e detalhes cabem embaixo da descrição, que de
            outro modo deixaria a coluna principal quase vazia.
          */}
          {ehPodcast ? (
            outrosEpisodios.length > 0 && (
              <section className="flex flex-col gap-4">
                <h2 className="font-display text-lg font-semibold">
                  Mais episódios
                </h2>
                <ul className="flex flex-col gap-3">
                  {outrosEpisodios.slice(0, LATERAL_EPISODIOS).map((item) => (
                    <li key={item.id}>
                      <ItemPodcast
                        conteudo={item}
                        progresso={progresso.get(item.id)}
                      />
                    </li>
                  ))}
                </ul>

                {/* Com mais episódios que o teto, a lista precisa de saída. */}
                {outrosEpisodios.length > LATERAL_EPISODIOS && (
                  <Link
                    href="/podcast"
                    className="border-borda bg-superficie hover:border-acento/60 hover:bg-superficie-2 flex min-h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold transition-colors"
                  >
                    Ver todos os episódios
                  </Link>
                )}
              </section>
            )
          ) : (
            <>
              <BlocoInstrutores conteudo={conteudo} />
              <BlocoDetalhes conteudo={conteudo} duracao={duracao} />
            </>
          )}
        </aside>
      </div>

      {!ehPodcast && relacionados.length > 0 && (
        <Trilho titulo="Relacionados" descricao="Continue por aqui">
          {relacionados.map((item) => (
            <CardConteudo
              key={item.id}
              conteudo={item}
              progresso={progresso.get(item.id)}
            />
          ))}
        </Trilho>
      )}
    </div>
  );

  /*
   * Mesma condição do botão "Assistir agora": bloqueado ou sem aula com vídeo,
   * não há player para prover — e a lista de aulas volta a levar para
   * `/assistir`, onde a tela de conteúdo exclusivo explica o porquê.
   */
  if (bloqueado || !aulaInicial) return corpo;

  return (
    <ProvedorPlayerConteudo
      aulas={aulasDoModal}
      inicialId={aulaInicial.id}
      abrirAoCarregar={assistir === "1"}
    >
      {corpo}
    </ProvedorPlayerConteudo>
  );
}

/* ---------------------------------------------------------------- */

function BlocoInstrutores({
  conteudo,
  ehPodcast = false,
}: {
  conteudo: Conteudo;
  ehPodcast?: boolean;
}) {
  return (
    <>
          {conteudo.instrutores.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="font-display text-lg font-semibold">
                {ehPodcast
                  ? conteudo.instrutores.length > 1
                    ? "Convidados"
                    : "Convidado"
                  : conteudo.instrutores.length > 1
                    ? "Instrutores"
                    : "Instrutor"}
              </h2>
              {conteudo.instrutores.map(({ instrutor }) => (
                <Link
                  key={instrutor.id}
                  href={`/instrutor/${instrutor.id}`}
                  className="border-borda-suave bg-superficie hover:border-acento/60 ease-suave flex gap-3 rounded-xl border p-4 transition-[border-color,transform] duration-200 active:scale-[0.99]"
                >
                  <div className="bg-superficie-2 relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                    {instrutor.avatar ? (
                      <Image
                        src={instrutor.avatar}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-texto-3 flex h-full items-center justify-center font-semibold">
                        {instrutor.nome.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold">{instrutor.nome}</p>
                    {instrutor.formacao && (
                      <p className="text-texto-3 text-xs leading-snug">
                        {instrutor.formacao}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </section>
          )}
    </>
  );
}

function BlocoDetalhes({
  conteudo,
  duracao,
}: {
  conteudo: Conteudo;
  duracao: number;
}) {
  return (
          <section className="border-borda-suave bg-superficie flex flex-col gap-3 rounded-xl border p-5">
            <h2 className="text-texto-2 text-xs font-semibold tracking-wider uppercase">
              Detalhes
            </h2>
            <dl className="flex flex-col gap-2.5 text-sm">
              {conteudo.categoria && (
                <div className="flex flex-col gap-0.5">
                  <dt className="text-texto-3 text-xs">Categoria</dt>
                  <dd>
                    <Link
                      href={`/categoria/${conteudo.categoria.id}`}
                      className="text-acento hover:text-acento-hover font-medium"
                    >
                      {conteudo.categoria.nome}
                    </Link>
                  </dd>
                </div>
              )}
              <Detalhe termo="Subcategoria" valor={conteudo.subcategoria?.nome} />
              <Detalhe
                termo="Duração"
                valor={duracao > 0 ? formatarDuracao(duracao) : null}
              />
              <Detalhe
                termo="Publicado"
                valor={conteudo.dataCriacao ? formatarData(conteudo.dataCriacao) : null}
              />
              <Detalhe termo="Pré-requisitos" valor={conteudo.requisitos} />
            </dl>
          </section>
  );
}

function Detalhe({ termo, valor }: { termo: string; valor?: string | null }) {
  if (!valor) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-texto-3 text-xs">{termo}</dt>
      <dd className="text-texto-2">{valor}</dd>
    </div>
  );
}

/**
 * Aula em que a reprodução deve começar.
 *
 * Mesma ordem de preferência da página `/assistir`: a começada e não terminada,
 * depois a primeira pendente, e só então a primeira da lista. É o que faz o
 * card de "continuar assistindo" cair na aula certa, e não no início do curso.
 */
function aulaParaRetomar(aulas: AulaDoModal[]): AulaDoModal | undefined {
  return (
    aulas.find((aula) => aula.segundosIniciais > 0 && !aula.concluido) ??
    aulas.find((aula) => !aula.concluido) ??
    aulas[0]
  );
}

/**
 * Aulas na forma que o modal consome, na ordem de exibição e carregando o
 * título do módulo a que pertencem.
 *
 * O progresso sai de `ProgressoVideo`, que `GET /conteudos/{id}` já devolve
 * filtrado para o usuário logado. É um instantâneo do carregamento da página:
 * trocar de aula e voltar dentro do mesmo modal retoma do valor gravado no
 * servidor, não do ponto exato onde a pessoa parou naquela sessão.
 */
function montarAulasDoModal(conteudo: Conteudo): AulaDoModal[] {
  const comModulo = (conteudo.modulos ?? []).flatMap((modulo) =>
    (modulo.videos ?? []).map((video) => ({ video, modulo: modulo.titulo })),
  );

  const candidatos = [
    ...(conteudo.videos ?? []).map((video) => ({ video, modulo: null })),
    ...comModulo,
  ];

  const vistos = new Set<number>();
  const aulas: AulaDoModal[] = [];

  for (const { video, modulo } of candidatos) {
    if (vistos.has(video.id)) continue;

    const vimeoId = extrairVimeoId(video.url);
    if (!vimeoId) continue;

    vistos.add(video.id);
    const progresso = video.ProgressoVideo?.[0] ?? null;

    aulas.push({
      id: video.id,
      titulo: video.titulo,
      vimeoId,
      duracao: video.duracao ?? null,
      // Aula concluída recomeça do zero, como na página de reprodução.
      segundosIniciais:
        progresso && !progresso.concluido ? progresso.segundos : 0,
      concluido: Boolean(progresso?.concluido),
      modulo: modulo as string | null,
    });
  }

  return aulas;
}

/** Vídeos soltos + vídeos dentro de módulos, na ordem de exibição. */
function listarAulas(conteudo: Conteudo): Video[] {
  const dosModulos = (conteudo.modulos ?? []).flatMap((m) => m.videos ?? []);
  const soltos = conteudo.videos ?? [];
  const vistos = new Set<number>();

  return [...soltos, ...dosModulos].filter((video) => {
    if (vistos.has(video.id)) return false;
    vistos.add(video.id);
    return true;
  });
}

/** O endpoint de recomendados ora devolve array puro, ora `{data}`. */
function normalizarRecomendados(
  resposta: Conteudo[] | Envelope<Conteudo> | null,
): Conteudo[] {
  if (!resposta) return [];
  if (Array.isArray(resposta)) return resposta;
  return resposta.data ?? [];
}
