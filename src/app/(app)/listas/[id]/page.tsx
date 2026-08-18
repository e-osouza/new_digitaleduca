import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obterLista } from "@/lib/queries";
import {
  extrairVimeoId,
  formatarDuracao,
  formatarRelogio,
  rotuloTipo,
} from "@/lib/format";
import { FAIXA } from "@/lib/ui";
import { Selo } from "@/components/selo";
import { BotaoExcluirLista } from "@/components/botao-excluir-lista";
import { GatilhoAula, ReprodutorLista } from "@/components/reprodutor-lista";
import type { AulaDoModal } from "@/components/modal-player";
import type { ItemLista, ListaDetalhe } from "@/types/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lista = await obterLista(Number(id));
  return { title: lista?.titulo ?? "Lista" };
}

export default async function PaginaLista({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const lista = await obterLista(numero);
  if (!lista) notFound();

  const itens = lista.items ?? [];
  const proxima = itens.find((item) => !item.concluido && !item.requerAssinatura);
  const capa = lista.thumbnailDesktopUrl ?? lista.thumbnailUrl;
  const concluida = lista.progressoPercent >= 100;

  /*
   * Aulas na forma que o modal consome — o mesmo player das páginas de
   * conteúdo. Reproduzir aqui evita a ida a `/assistir`: ao fechar, a jornada
   * já está de volta na tela, revalidada com o progresso da sessão.
   */
  const aulasDoModal = montarAulasDaLista(lista);
  const reproduziveis = new Set(aulasDoModal.map((aula) => aula.id));
  const aulaInicial =
    (proxima && reproduziveis.has(proxima.videoId)
      ? proxima.videoId
      : aulasDoModal[0]?.id) ?? 0;

  return (
    <ReprodutorLista
      aulas={aulasDoModal}
      listaId={lista.id}
      inicialId={aulaInicial}
    >
      <div className={`${FAIXA} flex flex-col gap-10 py-8 sm:py-10`}>
        <Link
          href="/listas"
          className="text-texto-3 hover:text-acento flex w-fit items-center gap-1.5 text-sm transition-colors"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4.5 6.5 10l5.5 5.5" />
          </svg>
          Listas
        </Link>

        <Cabecalho
          lista={lista}
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
                  listaId={lista.id}
                  ultima={indice === itens.length - 1}
                  anteriorConcluido={itens[indice - 1]?.concluido ?? false}
                  ehProxima={item.id === proxima?.id}
                  reproduzivel={reproduziveis.has(item.videoId)}
                />
              ))}
            </ol>
          </section>
        )}
      </div>
    </ReprodutorLista>
  );
}

/* ---------------------------- cabeçalho ---------------------------- */

function Cabecalho({
  lista,
  capa,
  proxima,
  concluida,
  reproduzivel,
}: {
  lista: ListaDetalhe;
  capa: string | null;
  proxima?: ItemLista;
  concluida: boolean;
  /** A próxima aula abre no modal; falso derruba para a página `/assistir`. */
  reproduzivel: boolean;
}) {
  const rotulo = lista.aulasConcluidas === 0 ? "Começar lista" : "Continuar";

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
              : lista.progressoPercent > 0
                ? "Em andamento"
                : "Não iniciada"}
          </Selo>
          <BotaoExcluirLista listaId={lista.id} />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
            {lista.titulo}
          </h1>
          {lista.descricao && (
            <p className="text-texto-2 leading-relaxed">{lista.descricao}</p>
          )}
        </div>

        <dl className="text-texto-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Medida rotulo="aulas">
            {lista.aulasConcluidas} de {lista.totalAulas}
          </Medida>
          {lista.tempoRestanteSegundos > 0 && (
            <Medida rotulo="restantes">
              {formatarDuracao(lista.tempoRestanteSegundos)}
            </Medida>
          )}
          {lista.sequenciaDias > 1 && (
            <Medida rotulo="seguidos">{lista.sequenciaDias} dias</Medida>
          )}
        </dl>

        <div className="flex flex-col gap-2">
          <div className="bg-superficie-2 h-2 overflow-hidden rounded-full">
            <div
              className="bg-acento ease-suave h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.min(Math.max(lista.progressoPercent, 0), 100)}%`,
              }}
            />
          </div>
          <span className="text-texto-3 text-xs tabular-nums">
            {lista.progressoPercent}% concluído
          </span>
        </div>

        {proxima &&
          (reproduzivel ? (
            <GatilhoAula videoId={proxima.videoId} className={visualChamada}>
              {chamada}
            </GatilhoAula>
          ) : (
            <Link
              href={destinoDaAula(proxima, lista.id)}
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
  listaId,
  ultima,
  anteriorConcluido,
  ehProxima,
  reproduzivel,
}: {
  item: ItemLista;
  indice: number;
  listaId: number;
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
              href={destinoDaAula(item, listaId)}
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

/* ---------------------------- reprodução ---------------------------- */

/**
 * Itens da lista na forma que o modal de reprodução consome, na ordem da
 * jornada.
 *
 * Ficam de fora as aulas que a API marcou como exclusivas de assinantes — elas
 * continuam levando ao `/planos` — e as sem vídeo do Vimeo resolvido, que não
 * teriam o que tocar. O `vimeoUri` vem no próprio `GET /listas/{id}`, então
 * montar a lista não custa nenhuma chamada extra.
 *
 * Bloqueadas entram: a lista lateral as mostra com cadeado e a conclusão da
 * anterior, dentro do próprio modal, libera a seguinte.
 */
function montarAulasDaLista(lista: ListaDetalhe): AulaDoModal[] {
  const vistos = new Set<number>();
  const aulas: AulaDoModal[] = [];

  for (const item of lista.items ?? []) {
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
      // Numa lista as aulas vêm de conteúdos diferentes: é por eles que a
      // lista lateral agrupa, e não pelo módulo de origem.
      modulo: item.conteudoTitulo ?? item.moduloTitulo ?? null,
      listaItemId: item.id,
      bloqueada: item.status === "BLOQUEADO" && !item.concluido,
    });
  }

  return aulas;
}

/**
 * A aula da lista aponta para o player do conteúdo de origem, levando o
 * contexto da lista para que o progresso dela também seja registrado.
 *
 * Continua servindo de reserva para as aulas que o modal não consegue tocar —
 * as sem `vimeoUri` resolvido.
 */
function destinoDaAula(item: ItemLista, listaId: number): string {
  if (!item.conteudoId) return "/listas";
  const busca = new URLSearchParams({
    aula: String(item.videoId),
    lista: String(listaId),
    item: String(item.id),
  });
  return `/assistir/${item.conteudoId}?${busca.toString()}`;
}
