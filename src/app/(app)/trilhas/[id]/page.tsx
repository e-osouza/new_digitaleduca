import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obterTrilha } from "@/lib/queries";
import {
  extrairVimeoId,
  formatarDuracao,
  formatarRelogio,
  rotuloTipo,
} from "@/lib/format";
import { FAIXA } from "@/lib/ui";
import { Selo } from "@/components/selo";
import { BotaoArquivarTrilha } from "@/components/botao-arquivar-trilha";
import { GatilhoAula, ReprodutorTrilha } from "@/components/reprodutor-trilha";
import type { AulaDoModal } from "@/components/modal-player";
import type { ItemTrilha, TrilhaDetalhe } from "@/types/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const trilha = await obterTrilha(Number(id));
  return { title: trilha?.titulo ?? "Trilha" };
}

export default async function PaginaTrilha({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const trilha = await obterTrilha(numero);
  if (!trilha) notFound();

  const itens = trilha.items ?? [];
  const proxima = itens.find((item) => !item.concluido && !item.requerAssinatura);
  const capa = trilha.thumbnailDesktopUrl ?? trilha.thumbnailUrl;
  const concluida = trilha.progressoPercent >= 100;

  /*
   * Aulas na forma que o modal consome — o mesmo player das páginas de
   * conteúdo. Reproduzir aqui evita a ida a `/assistir`: ao fechar, a jornada
   * já está de volta na tela, revalidada com o progresso da sessão.
   */
  const aulasDoModal = montarAulasDaTrilha(trilha);
  const reproduziveis = new Set(aulasDoModal.map((aula) => aula.id));
  const aulaInicial =
    (proxima && reproduziveis.has(proxima.videoId)
      ? proxima.videoId
      : aulasDoModal[0]?.id) ?? 0;

  return (
    <ReprodutorTrilha
      aulas={aulasDoModal}
      trilhaId={trilha.id}
      inicialId={aulaInicial}
    >
      <div className={`${FAIXA} flex flex-col gap-10 py-8 sm:py-10`}>
        <Link
          href="/trilhas"
          className="text-texto-3 hover:text-acento flex w-fit items-center gap-1.5 text-sm transition-colors"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4.5 6.5 10l5.5 5.5" />
          </svg>
          Trilhas
        </Link>

        <Cabecalho
          trilha={trilha}
          capa={capa}
          proxima={proxima}
          concluida={concluida}
          reproduzivel={Boolean(proxima && reproduziveis.has(proxima.videoId))}
        />

        {itens.length > 0 && (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-lg font-semibold">Sua jornada</h2>
              <p className="text-texto-3 text-sm">
                As aulas liberam na ordem — cada uma prepara a seguinte.
              </p>
            </div>

            <ol className="flex flex-col">
              {itens.map((item, indice) => (
                <LinhaJornada
                  key={item.id}
                  item={item}
                  indice={indice}
                  trilhaId={trilha.id}
                  ultima={indice === itens.length - 1}
                  anteriorConcluido={itens[indice - 1]?.concluido ?? false}
                  ehProxima={item.id === proxima?.id}
                  reproduzivel={reproduziveis.has(item.videoId)}
                />
              ))}
            </ol>
          </section>
        )}

        <SobreATrilha trilha={trilha} />
      </div>
    </ReprodutorTrilha>
  );
}

/* ---------------------------- cabeçalho ---------------------------- */

function Cabecalho({
  trilha,
  capa,
  proxima,
  concluida,
  reproduzivel,
}: {
  trilha: TrilhaDetalhe;
  capa: string | null;
  proxima?: ItemTrilha;
  concluida: boolean;
  /** A próxima aula abre no modal; falso derruba para a página `/assistir`. */
  reproduzivel: boolean;
}) {
  const rotulo = trilha.aulasConcluidas === 0 ? "Começar trilha" : "Continuar";

  const chamada = proxima && (
    <>
      <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4" fill="currentColor">
        <path d="M4 2.5v11l9-5.5-9-5.5Z" />
      </svg>
      {rotulo}
      <span className="hidden max-w-56 truncate font-normal opacity-80 sm:inline">
        · {proxima.titulo}
      </span>
    </>
  );

  const visualChamada =
    "bg-acento text-white hover:bg-acento-hover ease-suave flex min-h-12 w-fit items-center gap-2 rounded-full px-6 text-sm font-bold transition-all duration-200 hover:gap-3";

  return (
    <header className="border-borda-suave bg-superficie flex flex-col gap-6 rounded-2xl border p-5 sm:p-6 lg:flex-row lg:items-start lg:gap-8">
      {capa && (
        <div className="bg-superficie-2 relative aspect-video w-full shrink-0 overflow-hidden rounded-xl lg:w-72">
          <Image
            src={capa}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 288px"
            className="object-cover"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Selo variacao={concluida ? "gratis" : "acento"}>
            {concluida
              ? "Concluída"
              : trilha.progressoPercent > 0
                ? "Em andamento"
                : "Não iniciada"}
          </Selo>
          <BotaoArquivarTrilha trilhaId={trilha.id} />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
            {trilha.titulo}
          </h1>
          {trilha.descricao && (
            <p className="text-texto-2 leading-relaxed">{trilha.descricao}</p>
          )}
        </div>

        <dl className="text-texto-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Medida rotulo="aulas">
            {trilha.aulasConcluidas} de {trilha.totalAulas}
          </Medida>
          {trilha.tempoRestanteSegundos > 0 && (
            <Medida rotulo="restantes">
              {formatarDuracao(trilha.tempoRestanteSegundos)}
            </Medida>
          )}
          {trilha.sequenciaDias > 1 && (
            <Medida rotulo="seguidos">{trilha.sequenciaDias} dias</Medida>
          )}
        </dl>

        <div className="flex flex-col gap-2">
          <div className="bg-superficie-2 h-2 overflow-hidden rounded-full">
            <div
              className="bg-acento ease-suave h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.min(Math.max(trilha.progressoPercent, 0), 100)}%`,
              }}
            />
          </div>
          <span className="text-texto-3 text-xs tabular-nums">
            {trilha.progressoPercent}% concluído
          </span>
        </div>

        {proxima &&
          (reproduzivel ? (
            <GatilhoAula videoId={proxima.videoId} className={visualChamada}>
              {chamada}
            </GatilhoAula>
          ) : (
            <Link
              href={destinoDaAula(proxima, trilha.id)}
              className={visualChamada}
            >
              {chamada}
            </Link>
          ))}
      </div>
    </header>
  );
}

function Medida({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="sr-only">{rotulo}</dt>
      <dd className="text-texto font-semibold tabular-nums">{children}</dd>
      <span aria-hidden="true">{rotulo}</span>
    </div>
  );
}

/* ---------------------------- jornada ---------------------------- */

function LinhaJornada({
  item,
  indice,
  trilhaId,
  ultima,
  anteriorConcluido,
  ehProxima,
  reproduzivel,
}: {
  item: ItemTrilha;
  indice: number;
  trilhaId: number;
  ultima: boolean;
  /** Colore o trecho da espinha que vem de cima, para não trocar de cor no meio. */
  anteriorConcluido: boolean;
  ehProxima: boolean;
  /** A aula está na lista do modal; senão a linha volta a levar a `/assistir`. */
  reproduzivel: boolean;
}) {
  const bloqueada = item.status === "BLOQUEADO" && !item.concluido;
  const acessivel = !item.requerAssinatura && !bloqueada;

  /*
   * `span`, e não `div`: a linha inteira vira o conteúdo de um botão quando a
   * aula abre no player, e botão só aceita conteúdo de frase.
   */
  const conteudo = (
    <span
      className={`ease-suave flex flex-1 items-center gap-4 rounded-xl border p-3 transition-[border-color,background-color] duration-200 ${
        ehProxima
          ? "border-acento/50 bg-acento/5"
          : acessivel
            ? "border-borda-suave bg-superficie hover:border-acento/50 hover:bg-superficie-2"
            : "border-borda-suave bg-superficie/60"
      }`}
    >
      <span
        className={`bg-superficie-2 relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg sm:w-32 ${
          acessivel ? "" : "opacity-45 grayscale"
        }`}
      >
        {(item.thumbnailDesktopUrl ?? item.thumbnailUrl) && (
          <Image
            src={(item.thumbnailDesktopUrl ?? item.thumbnailUrl)!}
            alt=""
            fill
            sizes="128px"
            className="object-cover"
          />
        )}
        {item.progressoPercent > 0 && !item.concluido && (
          <span className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
            {/* Mesmo azul da barra dos cards — ver `--color-progresso`. */}
            <span
              className="bg-progresso block h-full"
              style={{ width: `${item.progressoPercent}%` }}
            />
          </span>
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-texto-3 text-[11px] font-semibold tracking-wider uppercase">
          Aula {indice + 1}
          {item.tipo ? ` · ${rotuloTipo(item.tipo)}` : ""}
        </span>

        <span
          className={`text-sm leading-snug font-semibold ${
            acessivel ? "text-texto" : "text-texto-3"
          }`}
        >
          {item.titulo}
        </span>

        <span className="text-texto-3 flex flex-wrap items-center gap-x-2 text-xs">
          {/* O nome do conteúdo só ajuda quando difere do título da aula. */}
          {item.conteudoTitulo && item.conteudoTitulo !== item.titulo && (
            <span className="truncate">{item.conteudoTitulo}</span>
          )}
          {item.duracaoSegundos > 0 && (
            <span className="tabular-nums">
              {formatarRelogio(item.duracaoSegundos)}
            </span>
          )}
          {item.concluido ? (
            <span className="text-sucesso font-medium">concluída</span>
          ) : item.progressoPercent > 0 ? (
            <span className="text-acento font-medium tabular-nums">
              {item.progressoPercent}% assistido
            </span>
          ) : null}
        </span>
      </span>

      {item.requerAssinatura ? (
        <span className="text-texto-3 shrink-0 text-xs font-medium">
          Assinantes
        </span>
      ) : bloqueada ? (
        <span className="text-texto-3 hidden shrink-0 text-xs sm:block">
          Conclua a anterior
        </span>
      ) : null}
    </span>
  );

  return (
    <li className="flex gap-4">
      {/*
       * Espinha da linha do tempo. O traço de cima e o de baixo se encostam nas
       * bordas do <li>, então a linha segue contínua de um item ao outro.
       */}
      <div className="flex shrink-0 flex-col items-center">
        <span
          aria-hidden="true"
          className={`min-h-3 w-0.5 flex-1 ${
            indice === 0
              ? "bg-transparent"
              : anteriorConcluido
                ? "bg-sucesso/40"
                : "bg-borda-suave"
          }`}
        />
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold tabular-nums ${
            item.concluido
              ? "border-sucesso bg-sucesso/15 text-sucesso"
              : ehProxima
                ? "border-acento bg-acento text-white"
                : acessivel
                  ? "border-borda text-texto-3"
                  : "border-borda-suave text-texto-3"
          }`}
        >
          {item.concluido ? (
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 10.5 3.5 3.5L15 7" />
            </svg>
          ) : !acessivel ? (
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="4.5" y="9" width="11" height="7" rx="1.8" />
              <path d="M7 9V6.8a3 3 0 0 1 6 0V9" />
            </svg>
          ) : (
            indice + 1
          )}
        </span>

        <span
          aria-hidden="true"
          className={`min-h-3 w-0.5 flex-1 ${
            ultima
              ? "bg-transparent"
              : item.concluido
                ? "bg-sucesso/40"
                : "bg-borda-suave"
          }`}
        />
      </div>

      <div className="flex flex-1 pb-3">
        {acessivel ? (
          reproduzivel ? (
            <GatilhoAula
              videoId={item.videoId}
              className="flex flex-1 text-left active:scale-[0.995]"
            >
              {conteudo}
            </GatilhoAula>
          ) : (
            <Link
              href={destinoDaAula(item, trilhaId)}
              className="flex flex-1 active:scale-[0.995]"
            >
              {conteudo}
            </Link>
          )
        ) : item.requerAssinatura ? (
          <Link href="/planos" className="flex flex-1">
            {conteudo}
          </Link>
        ) : (
          <div className="flex flex-1 cursor-not-allowed">{conteudo}</div>
        )}
      </div>
    </li>
  );
}

/* ---------------------------- sobre ---------------------------- */

/**
 * Respostas do questionário que originou a trilha. A referência esconde isso
 * atrás de uma aba; aqui fica visível ao fim da jornada, que é onde ajuda a
 * lembrar por que a trilha foi montada assim.
 */
function SobreATrilha({ trilha }: { trilha: TrilhaDetalhe }) {
  const respostas = [
    { rotulo: "Objetivo", valor: trilha.objetivo },
    { rotulo: "Área de interesse", valor: trilha.areaInteresse },
    { rotulo: "Nível", valor: trilha.nivelAtual },
    { rotulo: "Tempo por semana", valor: trilha.tempoDisponivel },
    { rotulo: "Formato preferido", valor: trilha.preferencia },
    { rotulo: "Onde quer chegar", valor: trilha.objetivoFinal },
  ].filter((r) => r.valor);

  if (respostas.length === 0) return null;

  return (
    <section className="border-borda-suave flex flex-col gap-4 rounded-2xl border p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg font-semibold">
          Por que esta trilha
        </h2>
        <p className="text-texto-3 text-sm">
          Montada a partir das suas respostas no questionário.
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {respostas.map((resposta) => (
          <div key={resposta.rotulo} className="flex flex-col gap-0.5">
            <dt className="text-texto-3 text-xs">{resposta.rotulo}</dt>
            <dd className="text-sm font-medium">{resposta.valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ---------------------------- reprodução ---------------------------- */

/**
 * Itens da trilha na forma que o modal de reprodução consome, na ordem da
 * jornada.
 *
 * Ficam de fora as aulas que a API marcou como exclusivas de assinantes — elas
 * continuam levando ao `/planos` — e as sem vídeo do Vimeo resolvido, que não
 * teriam o que tocar. O `vimeoUri` vem no próprio `GET /trilhas/{id}`, então
 * montar a lista não custa nenhuma chamada extra.
 *
 * Bloqueadas entram: a lista lateral as mostra com cadeado e a conclusão da
 * anterior, dentro do próprio modal, libera a seguinte.
 */
function montarAulasDaTrilha(trilha: TrilhaDetalhe): AulaDoModal[] {
  const vistos = new Set<number>();
  const aulas: AulaDoModal[] = [];

  for (const item of trilha.items ?? []) {
    if (item.requerAssinatura || vistos.has(item.videoId)) continue;

    const vimeoId = extrairVimeoId(item.vimeoUri);
    if (!vimeoId) continue;

    vistos.add(item.videoId);
    aulas.push({
      id: item.videoId,
      titulo: item.titulo,
      vimeoId,
      duracao: item.duracaoSegundos > 0 ? item.duracaoSegundos : null,
      // Aula concluída recomeça do zero, como nas páginas de conteúdo.
      segundosIniciais: item.concluido ? 0 : item.segundosAssistidos,
      concluido: item.concluido,
      // Numa trilha as aulas vêm de conteúdos diferentes: é por eles que a
      // lista lateral agrupa, e não pelo módulo de origem.
      modulo: item.conteudoTitulo ?? item.moduloTitulo ?? null,
      trailItemId: item.id,
      bloqueada: item.status === "BLOQUEADO" && !item.concluido,
    });
  }

  return aulas;
}

/**
 * A aula da trilha aponta para o player do conteúdo de origem, levando o
 * contexto da trilha para que o progresso dela também seja registrado.
 *
 * Continua servindo de reserva para as aulas que o modal não consegue tocar —
 * as sem `vimeoUri` resolvido.
 */
function destinoDaAula(item: ItemTrilha, trilhaId: number): string {
  if (!item.conteudoId) return "/trilhas";
  const busca = new URLSearchParams({
    aula: String(item.videoId),
    trilha: String(trilhaId),
    item: String(item.id),
  });
  return `/assistir/${item.conteudoId}?${busca.toString()}`;
}
