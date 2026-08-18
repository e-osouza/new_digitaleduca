"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Player } from "@/components/player";
import { formatarData, formatarRelogio } from "@/lib/format";
import { PARAM_EPISODIO } from "@/lib/podcast";
import {
  useReprodutorPodcast,
  type Episodio,
  type ModoPodcast,
} from "@/components/podcast/provedor";

const VELOCIDADES = [1, 1.25, 1.5, 2];

/**
 * Tela do podcast: player à esquerda, playlist à direita.
 *
 * A página NÃO possui o áudio — quem toca é o provedor, no layout. Aqui só há
 * comando e leitura de estado, e é isso que permite sair da tela sem cortar o
 * episódio: o rodapé assume com o mesmo elemento.
 */
export function PaginaPodcast({
  episodios,
  descricao,
  episodioInicial = null,
}: {
  episodios: Episodio[];
  descricao: string;
  /**
   * Episódio que chega pela URL e deve abrir TOCANDO — é o que acontece ao
   * clicar num card de podcast em qualquer outro ponto da plataforma.
   */
  episodioInicial?: number | null;
}) {
  const r = useReprodutorPodcast();

  /*
   * As duas funções saem do contexto por desestruturação, e não como `r.algo`
   * dentro do efeito: `r` é recriado a cada `timeupdate` (o tempo é estado),
   * então usá-lo como dependência faria os efeitos abaixo rodarem umas quatro
   * vezes por segundo. Estas duas são estáveis.
   */
  const { registrarPagina, cederPara, retomarEm, definirModo, abrir } = r;

  /* Enquanto esta tela existe, o mini player do rodapé se cala. */
  useEffect(() => {
    registrarPagina(true);
    return () => registrarPagina(false);
  }, [registrarPagina]);

  /*
   * Chegada por um card de podcast: abre tocando o episódio pedido.
   *
   * O `?episodio=` sai da URL logo em seguida, por `replaceState` — assim um
   * F5 mais tarde não arrasta a pessoa de volta para esse episódio depois de
   * ela ter escolhido outro na playlist. Trocar por `router.replace` daria uma
   * navegação e remontaria a tela no meio da reprodução.
   *
   * A guarda de uma vez só é necessária: o efeito depende de `abrir`, que muda
   * quando o episódio no ar muda — sem ela, escolher outro episódio na
   * playlist devolveria o comando ao da URL.
   */
  const jaAbriuDaUrl = useRef(false);

  useEffect(() => {
    if (jaAbriuDaUrl.current || episodioInicial === null) return;

    const pedido = episodios.find((e) => e.conteudoId === episodioInicial);
    if (!pedido) return;

    jaAbriuDaUrl.current = true;
    abrir(pedido, episodios);

    const url = new URL(window.location.href);
    url.searchParams.delete(PARAM_EPISODIO);
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [abrir, episodioInicial, episodios]);

  // Sem nada tocando, a tela já mostra o primeiro episódio pronto para o play.
  const emFoco = r.episodio ?? episodios[0] ?? null;

  /*
   * Posição do <Player> de vídeo, gravada em ref porque chega a cada
   * `timeupdate` — em estado, seriam quatro renders por segundo da tela toda.
   * É ela que devolve o ponto ao áudio na volta.
   */
  const tempoDoVideo = useRef(0);
  /*
   * Instante do último avanço do vídeo. `timeupdate` só dispara enquanto ele
   * TOCA, então "houve avanço há menos de um segundo" é o mesmo que "estava
   * tocando" — e é como sabemos se devemos ou não continuar em áudio ao sair
   * da tela. Antes um sinalizador ligava na primeira reprodução e nunca mais
   * desligava: pausar o vídeo e sair começava a tocar o áudio sozinho.
   */
  const avancoEm = useRef(0);

  /*
   * Troca de modo com continuidade.
   *
   * A parte que importa é o `cederPara`/`retomarEm`: quem reproduz muda de
   * dono, mas o episódio segue do mesmo segundo — trocar de modo não é
   * recomeçar. O `apagando` é só o acabamento: sem ele a substituição de uma
   * capa quadrada por um quadro 16/9 é um corte seco.
   */
  const [apagando, setApagando] = useState(false);

  /*
   * Ponto de retomada do vídeo, amarrado ao episódio que o gerou.
   *
   * Guardar só o número deixava a posição do episódio anterior vazar para o
   * seguinte quando se troca de faixa em modo vídeo — o novo começaria no
   * minuto em que o antigo parou. Comparar o `conteudoId` no render também
   * dispensa um efeito de limpeza, que chegaria tarde demais: o <Player> já
   * teria montado com o valor errado.
   */
  const [retomada, setRetomada] = useState<{
    conteudoId: number;
    segundos: number;
  } | null>(null);

  const trocarModo = useCallback(
    (destino: ModoPodcast) => {
      if (destino === r.modo) return;

      const indoParaVideo = destino === "video";
      const posicao = indoParaVideo ? cederPara() : tempoDoVideo.current;
      const tocava = indoParaVideo ? r.tocando : Date.now() - avancoEm.current < 1000;

      setApagando(true);

      window.setTimeout(() => {
        definirModo(destino);
        if (indoParaVideo) {
          tempoDoVideo.current = posicao;
          if (emFoco) setRetomada({ conteudoId: emFoco.conteudoId, segundos: posicao });
        } else {
          retomarEm(posicao, tocava);
        }
        setApagando(false);
      }, 180);
    },
    [cederPara, definirModo, emFoco, r.modo, r.tocando, retomarEm],
  );

  const marcarTempoDoVideo = useCallback((segundos: number) => {
    tempoDoVideo.current = segundos;
    avancoEm.current = Date.now();
  }, []);


  /*
   * Sair da tela devolve o episódio ao áudio — SEMPRE, e não só quando o vídeo
   * chegou a andar. Em modo vídeo o elemento do provedor fica sem fonte
   * nenhuma, de propósito; sem esta volta, o mini player apareceria no rodapé
   * sem ter o que tocar. Em modo áudio o provedor ignora a chamada — ver
   * `retomarEm`, onde está o porquê.
   */
  useEffect(() => {
    return () => {
      retomarEm(tempoDoVideo.current, Date.now() - avancoEm.current < 1000);
    };
  }, [retomarEm]);

  const noAr = r.episodio?.conteudoId === emFoco?.conteudoId;

  if (!emFoco) return null;

  const duracao = noAr && r.duracao > 0 ? r.duracao : emFoco.duracao;
  const tempo = noAr ? r.tempo : 0;
  const preenchido = duracao > 0 ? Math.min((tempo / duracao) * 100, 100) : 0;
  const modoVideo = r.modo === "video";
  const ouvidoEmFoco = r.concluidos.has(emFoco.conteudoId) || emFoco.concluido;
  const progressoEmFoco = noAr ? preenchido : emFoco.percentual;

  return (
    <div className="calha grid w-full gap-5 py-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:py-8">
      {/* ---------- coluna do player ---------- */}
      <div className="flex min-w-0 flex-col gap-5">
        <section className="border-borda-suave bg-superficie flex flex-col gap-6 rounded-2xl border p-5 sm:p-7">
          {/*
            Em vídeo o quadro ocupa a largura inteira do cartão e o texto desce
            para baixo dele; em áudio, a capa quadrada fica ao lado do texto.
            A opacidade cobre a troca — ver `trocarModo`.
          */}
          <div
            className={`ease-suave transition-opacity duration-200 ${
              apagando ? "opacity-0" : "opacity-100"
            } ${
              modoVideo
                ? "flex flex-col gap-5"
                : "flex flex-col gap-6 sm:flex-row sm:gap-7"
            }`}
          >
            <div
              className={
                modoVideo
                  ? "flex flex-col gap-3"
                  : "flex shrink-0 flex-col gap-3"
              }
            >
              {modoVideo && r.midia ? (
                /*
                 * O player da plataforma, o mesmo das aulas: controles
                 * próprios, qualidade, legendas, PiP e — o que motivou a
                 * troca — a tela cheia com a barra da casa, em vez dos
                 * controles nativos do navegador.
                 */
                <Player
                  key={r.midia.videoId}
                  vimeoId={r.midia.vimeoId}
                  videoId={r.midia.videoId}
                  segundosIniciais={
                    retomada?.conteudoId === emFoco.conteudoId
                      ? retomada.segundos
                      : r.midia.segundos
                  }
                  titulo={`${emFoco.convidado}${emFoco.tema ? ` — ${emFoco.tema}` : ""}`}
                  aoProgredir={marcarTempoDoVideo}
                  aoFinalizar={r.proximo}
                />
              ) : (
                <div
                  className={`bg-superficie-2 relative w-full overflow-hidden rounded-xl ${
                    modoVideo
                      ? "aspect-video"
                      : "aspect-square sm:w-[248px] lg:w-[300px]"
                  }`}
                >
                  {emFoco.capa && (
                    <Image
                      src={emFoco.capa}
                      alt=""
                      fill
                      sizes={modoVideo ? "(max-width: 1024px) 100vw, 640px" : "300px"}
                      className="object-cover"
                      priority
                    />
                  )}
                </div>
              )}

              <AlternadorModo modo={r.modo} aoTrocar={trocarModo} />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              {noAr && (
                <span className="bg-acento/12 text-acento flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold">
                  <IconeOnda animando={r.tocando} />
                  {r.tocando ? "Reproduzindo agora" : "Em pausa"}
                </span>
              )}

              <h1 className="font-display text-xl leading-tight font-semibold tracking-tight text-balance sm:text-2xl">
                {emFoco.tema ?? emFoco.convidado}
              </h1>

              {emFoco.tema && (
                <p className="text-texto-2 font-medium">{emFoco.convidado}</p>
              )}

              <div className="text-texto-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm tabular-nums">
                <span className="flex items-center gap-1.5">
                  <IconeRelogio />
                  {formatarRelogio(duracao)}
                </span>
                {emFoco.publicadoEm && (
                  <span className="flex items-center gap-1.5">
                    <IconeCalendario />
                    Publicado em {formatarData(emFoco.publicadoEm)}
                  </span>
                )}
              </div>

              {r.erro && noAr && (
                <p className="text-alerta text-sm font-medium">{r.erro}</p>
              )}
            </div>
          </div>

          {/*
            Transporte próprio SÓ em áudio. Em vídeo quem comanda é o <Player>,
            que traz a barra completa — duas réguas sobre o mesmo episódio
            brigariam entre si, e a de baixo mostraria um tempo que não é o
            dele.
          */}
          {!modoVideo && (
          <div className="border-borda-suave flex flex-col gap-5 border-t pt-5">
            <div className="flex items-center gap-3">
              <span className="text-texto-3 w-10 shrink-0 text-[11px] tabular-nums sm:w-12 sm:text-xs">
                {formatarRelogio(tempo)}
              </span>
              <input
                type="range"
                min={0}
                max={Math.max(duracao, 1)}
                step={1}
                value={tempo}
                onChange={(e) => r.irPara(Number(e.target.value))}
                disabled={!noAr}
                aria-label="Posição do episódio"
                className="regua-podcast w-full min-w-0 disabled:opacity-50"
                style={{ "--preenchido": `${preenchido}%` } as React.CSSProperties}
              />
              <span className="text-texto-3 w-10 shrink-0 text-right text-[11px] tabular-nums sm:w-12 sm:text-xs">
                {formatarRelogio(duracao)}
              </span>
            </div>

            {/*
              Os rótulos somem no celular: "Velocidade" sozinho mede mais que
              o botão que ele descreve, e cinco comandos com legenda não cabem
              numa faixa de 375px. Era esta fileira que empurrava a largura da
              coluna e estourava a página inteira para fora da tela.
            */}
            <div className="flex items-center justify-center gap-4 xs:gap-6 sm:gap-10">
              <Comando
                rotulo="Velocidade"
                onClick={() =>
                  r.definirVelocidade(
                    VELOCIDADES[
                      (VELOCIDADES.indexOf(r.velocidade) + 1) % VELOCIDADES.length
                    ],
                  )
                }
              >
                <span className="text-sm font-bold tabular-nums">
                  {r.velocidade}x
                </span>
              </Comando>

              <Comando rotulo="Voltar" onClick={() => r.pular(-15)} desativado={!noAr}>
                <IconePular sentido="tras" />
              </Comando>

              <button
                type="button"
                onClick={() => (noAr ? r.alternar() : r.abrir(emFoco, episodios))}
                disabled={r.carregando}
                aria-label={r.tocando ? "Pausar" : "Tocar"}
                className="bg-acento hover:bg-acento-hover flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition-colors disabled:opacity-60 sm:h-16 sm:w-16"
              >
                {r.carregando ? (
                  <IconeCarregando />
                ) : r.tocando ? (
                  <IconePausa />
                ) : (
                  <IconePlay />
                )}
              </button>

              <Comando rotulo="Avançar" onClick={() => r.pular(15)} desativado={!noAr}>
                <IconePular sentido="frente" />
              </Comando>

              <Comando rotulo="Próximo" onClick={r.proximo} desativado={!noAr}>
                <IconeProximo />
              </Comando>
            </div>
          </div>
          )}
        </section>

        {/*
          Ficha do episódio. Ocupa o lugar do antigo "Sobre o podcast", que
          repetia a mesma frase em todos os episódios — abaixo do player o que
          se quer saber é sobre o que está tocando. A descrição do podcast
          sobrou como rodapé, que é o peso que ela merece.
        */}
        <section className="border-borda-suave bg-superficie flex flex-col gap-5 rounded-2xl border p-5 sm:p-7">
          <h2 className="font-display font-semibold">Sobre o episódio</h2>

          {emFoco.descricao ? (
            <p className="text-texto-2 max-w-prose text-sm leading-relaxed">
              {emFoco.descricao}
            </p>
          ) : (
            <p className="text-texto-3 text-sm">
              Este episódio ainda não tem descrição.
            </p>
          )}

          {/*
            Grade, e não linha corrida: os rótulos mudam de episódio para
            episódio (nem todo um tem nível ou categoria) e uma lista de pares
            aguenta as ausências sem deixar buraco.
          */}
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Ficha rotulo="Convidado" valor={emFoco.convidado} />
            {emFoco.instrutores.length > 0 && (
              <Ficha
                rotulo={
                  emFoco.instrutores.length > 1 ? "Apresentam" : "Apresenta"
                }
                valor={emFoco.instrutores.join(", ")}
              />
            )}
            {emFoco.categoria && (
              <Ficha rotulo="Categoria" valor={emFoco.categoria} />
            )}
            <Ficha rotulo="Duração" valor={formatarRelogio(duracao)} />
            {emFoco.publicadoEm && (
              <Ficha
                rotulo="Publicado em"
                valor={formatarData(emFoco.publicadoEm)}
              />
            )}
            <Ficha
              rotulo="Você ouviu"
              valor={
                ouvidoEmFoco
                  ? "O episódio inteiro"
                  : progressoEmFoco > 0
                    ? `${Math.round(progressoEmFoco)}% — faltam ${formatarRelogio(
                        Math.max(duracao - (progressoEmFoco / 100) * duracao, 0),
                      )}`
                    : "Ainda não começou"
              }
            />
          </dl>

          <p className="border-borda-suave text-texto-3 border-t pt-4 text-xs leading-relaxed">
            {descricao}
          </p>
        </section>
      </div>

      {/* ---------- playlist ---------- */}
      <section className="border-borda-suave bg-superficie flex h-fit min-w-0 flex-col gap-3 rounded-2xl border p-4 sm:p-5 lg:sticky lg:top-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display font-semibold">Playlist</h2>
          <span className="text-texto-3 text-xs tabular-nums">
            {episodios.length}{" "}
            {episodios.length === 1 ? "episódio" : "episódios"}
          </span>
        </div>

        <ul className="-mx-1 flex max-h-[62vh] flex-col gap-1 overflow-y-auto px-1">
          {episodios.map((ep, indice) => {
            const atual = r.episodio?.conteudoId === ep.conteudoId;

            /*
             * O episódio no ar informa a si mesmo: o percentual do servidor é
             * de quando a página carregou, e ver a própria barra parada
             * enquanto se ouve seria estranho.
             */
            const andamento =
              atual && r.duracao > 0
                ? Math.min((r.tempo / r.duracao) * 100, 100)
                : ep.percentual;

            const ouvido = r.concluidos.has(ep.conteudoId) || ep.concluido;
            const restante = Math.max(
              ep.duracao - (andamento / 100) * ep.duracao,
              0,
            );

            return (
              <li key={ep.conteudoId}>
                <button
                  type="button"
                  onClick={() => r.abrir(ep, episodios)}
                  aria-current={atual ? "true" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors ${
                    atual
                      ? "bg-acento/10"
                      : "hover:bg-superficie-2 active:bg-borda-suave"
                  }`}
                >
                  <span
                    className={`w-4 shrink-0 text-center text-xs font-semibold tabular-nums ${
                      atual ? "text-acento" : "text-texto-3"
                    }`}
                  >
                    {atual ? <IconeOnda animando={r.tocando} /> : indice + 1}
                  </span>

                  <span className="bg-superficie-2 relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                    {ep.capa && (
                      <Image
                        src={ep.capa}
                        alt=""
                        fill
                        sizes="48px"
                        className={`object-cover ${ouvido ? "opacity-45" : ""}`}
                      />
                    )}

                    {/*
                      O visto fica SOBRE a capa, e não numa coluna própria: a
                      linha já tem número, título, tema e duração, e mais uma
                      coluna espremeria o texto que importa.
                    */}
                    {ouvido && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45">
                        <span className="bg-sucesso flex h-6 w-6 items-center justify-center rounded-full text-white">
                          <IconeVisto />
                        </span>
                      </span>
                    )}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                      className={`truncate text-sm font-semibold ${
                        atual
                          ? "text-acento"
                          : ouvido
                            ? "text-texto-3"
                            : "text-texto"
                      }`}
                    >
                      {ep.convidado}
                    </span>
                    {ep.tema && (
                      <span className="text-texto-3 line-clamp-2 text-xs leading-snug">
                        {ep.tema}
                      </span>
                    )}

                    <span className="text-texto-3 flex items-center gap-2 text-xs tabular-nums">
                      {ouvido ? (
                        <span className="text-sucesso font-semibold">Ouvido</span>
                      ) : (
                        formatarRelogio(ep.duracao)
                      )}
                      {!ouvido && andamento > 0 && (
                        <span>· faltam {formatarRelogio(restante)}</span>
                      )}
                    </span>

                    {/*
                      A barra só aparece no que foi COMEÇADO e não terminado —
                      é a pergunta que ela responde ("o que falta acabar"). Numa
                      lista em que toda linha tem barra, as cheias e as vazias
                      viram ruído e a informação some.
                    */}
                    {!ouvido && andamento > 0 && (
                      <span className="bg-superficie-2 mt-1 block h-1 overflow-hidden rounded-full">
                        <span
                          className="bg-acento ease-suave block h-full rounded-full transition-[width] duration-500"
                          style={{ width: `${andamento}%` }}
                        />
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Par rótulo/valor da ficha do episódio. */
function Ficha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-texto-3 text-[11px] font-semibold tracking-[0.08em] uppercase">
        {rotulo}
      </dt>
      <dd className="text-texto-2 text-sm">{valor}</dd>
    </div>
  );
}

/** Botão secundário do painel de controles: ícone em cima, rótulo embaixo. */
function Comando({
  rotulo,
  onClick,
  desativado = false,
  children,
}: {
  rotulo: string;
  onClick: () => void;
  desativado?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desativado}
      aria-label={rotulo}
      className="text-texto-2 hover:text-acento flex flex-col items-center gap-1.5 transition-colors disabled:opacity-40"
    >
      <span className="flex h-6 items-center justify-center">{children}</span>
      <span className="xs:block hidden text-[11px] font-medium">{rotulo}</span>
    </button>
  );
}

function AlternadorModo({
  modo,
  aoTrocar,
}: {
  modo: ModoPodcast;
  aoTrocar: (valor: ModoPodcast) => void;
}) {
  return (
    /*
     * `inline-flex` e largura de conteúdo, sem `flex-1` nos botões.
     *
     * Repartir o espaço funcionava enquanto o alternador vivia sob a capa de
     * 300px, mas em modo vídeo o pai passa a ser `fit-content` — e aí
     * `flex-1` (base 0) não tem espaço definido para repartir: o botão
     * encolhia e "Com vídeo" quebrava em duas linhas. Medido pelo conteúdo, o
     * controle tem o mesmo tamanho nos dois modos, que também é o certo: ele
     * não deveria mudar de forma quando a tela ao lado muda.
     */
    <div
      role="group"
      aria-label="Forma de reprodução"
      className="border-borda-suave bg-fundo-2 inline-flex w-fit gap-1 rounded-full border p-1"
    >
      {(
        [
          ["audio", "Só áudio"],
          ["video", "Com vídeo"],
        ] as const
      ).map(([valor, rotulo]) => (
        <button
          key={valor}
          type="button"
          onClick={() => aoTrocar(valor)}
          aria-pressed={modo === valor}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
            modo === valor
              ? "bg-acento text-white"
              : "text-texto-2 hover:text-texto"
          }`}
        >
          {rotulo}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------- ícones ---------------------------- */

function IconePlay() {
  return (
    <svg viewBox="0 0 16 16" className="ml-1 h-6 w-6" fill="currentColor">
      <path d="M4 2.5v11l9-5.5-9-5.5Z" />
    </svg>
  );
}

function IconePausa() {
  return (
    <svg viewBox="0 0 16 16" className="h-6 w-6" fill="currentColor">
      <path d="M4.5 3h2.5v10H4.5zM9 3h2.5v10H9z" />
    </svg>
  );
}

function IconeCarregando() {
  return (
    <svg viewBox="0 0 20 20" className="h-6 w-6 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 2.5a7.5 7.5 0 1 0 7.5 7.5" />
    </svg>
  );
}

function IconePular({ sentido }: { sentido: "tras" | "frente" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-6 w-6 ${sentido === "tras" ? "-scale-x-100" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 4.5a6 6 0 1 0 5.5 3.6" />
      <path d="M15.5 3v5h-5" />
    </svg>
  );
}

function IconeProximo() {
  return (
    <svg viewBox="0 0 20 20" className="h-6 w-6" fill="currentColor">
      <path d="M5 4.5v11l8-5.5-8-5.5Z" />
      <rect x="14" y="4.5" width="2" height="11" rx="1" />
    </svg>
  );
}

function IconeRelogio() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.5V10l3 1.8" />
    </svg>
  );
}

function IconeVisto() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 10.5 3.5 3.5L15 6.5" />
    </svg>
  );
}

function IconeCalendario() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="14" height="13" rx="2" />
      <path d="M3 8.5h14M7 3v3M13 3v3" />
    </svg>
  );
}

/** Três barrinhas que sobem e descem enquanto o episódio toca. */
function IconeOnda({ animando }: { animando: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      {[
        { x: 1.5, atraso: "0ms" },
        { x: 6.5, atraso: "160ms" },
        { x: 11.5, atraso: "320ms" },
      ].map(({ x, atraso }) => (
        <rect key={x} x={x} y="3" width="3" height="10" rx="1.5">
          {animando && (
            <animate
              attributeName="height"
              values="4;10;4"
              dur="0.9s"
              begin={atraso}
              repeatCount="indefinite"
            />
          )}
          {animando && (
            <animate
              attributeName="y"
              values="6;3;6"
              dur="0.9s"
              begin={atraso}
              repeatCount="indefinite"
            />
          )}
        </rect>
      ))}
    </svg>
  );
}
