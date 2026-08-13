"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { formatarRelogio } from "@/lib/format";

/** Uma qualidade oferecida pelo manifesto HLS. `indice` é o índice no hls.js. */
export type Qualidade = { indice: number; altura: number };

const VELOCIDADES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
/** Segundos do pulo curto (setas) e do longo (J/L e os botões). */
const PULO_CURTO = 5;
const PULO_LONGO = 10;
/** Inatividade até os controles sumirem durante a reprodução. */
const MS_ATE_OCULTAR = 2600;

export function ControlesPlayer({
  videoRef,
  montado,
  container,
  titulo,
  qualidades,
  qualidadeAtual,
  aoTrocarQualidade,
  temLegenda,
  legendaLigada,
  aoAlternarLegenda,
  carregando,
}: {
  /**
   * O elemento chega por ref, não por valor: mutar uma prop é proibido pelo
   * React Compiler, e a ref é o canal previsto para escrever num nó do DOM.
   */
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Vira `true` quando o <video> monta — é o que faz os efeitos reassinarem. */
  montado: boolean;
  container: HTMLElement | null;
  titulo: string;
  qualidades: Qualidade[];
  /** Índice do nível fixado, ou -1 para automático. */
  qualidadeAtual: number;
  aoTrocarQualidade: (indice: number) => void;
  temLegenda: boolean;
  /*
   * A legenda é comandada pelo pai porque quem renderiza os <track> é ele: as
   * faixas pertencem ao elemento dele, não a estes controles.
   */
  legendaLigada: boolean;
  aoAlternarLegenda: () => void;
  carregando: boolean;
}) {
  const midia = useMidia(videoRef, montado);
  const { visivel, acordar } = useVisibilidade(midia.tocando);
  const [menuAberto, setMenuAberto] = useState<"velocidade" | "qualidade" | null>(
    null,
  );

  /* ---- comandos ---- */

  const alternar = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    // Retomar a reprodução precisa reacender a barra: ela pode ter sumido por
    // inatividade antes da pausa, e voltaria escondida.
    acordar();
    if (video.paused) void video.play().catch(() => {});
    else video.pause();
  }, [videoRef, acordar]);

  const pular = useCallback(
    (segundos: number) => {
      const video = videoRef.current;
      if (!video) return;
      const limite = Number.isFinite(video.duration) ? video.duration : Infinity;
      video.currentTime = Math.min(Math.max(video.currentTime + segundos, 0), limite);
    },
    [videoRef],
  );

  const irPara = useCallback(
    (segundos: number) => {
      const video = videoRef.current;
      if (video) video.currentTime = segundos;
    },
    [videoRef],
  );

  const ajustarVolume = useCallback(
    (valor: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.volume = Math.min(Math.max(valor, 0), 1);
      video.muted = video.volume === 0;
    },
    [videoRef],
  );

  const alternarMudo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    // Sair do mudo com o volume zerado não produz som — devolve um patamar audível.
    if (video.muted && video.volume === 0) video.volume = 0.5;
    video.muted = !video.muted;
  }, [videoRef]);

  const alternarTela = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
      return;
    }

    /*
     * O Safari do iPhone não implementa tela cheia em elemento comum: só o
     * próprio <video> entra, pelo método proprietário. Sem este desvio o botão
     * simplesmente não faz nada no celular da Apple.
     */
    if (container?.requestFullscreen) {
      // A trava de orientação só é aceita com a tela cheia já ativa.
      void container.requestFullscreen().then(travarPaisagem).catch(() => {});
      return;
    }

    const video = videoRef.current as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null;
    video?.webkitEnterFullscreen?.();
  }, [container, videoRef]);

  const alternarPip = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement) {
      void document.exitPictureInPicture().catch(() => {});
    } else {
      void video.requestPictureInPicture?.().catch(() => {});
    }
  }, [videoRef]);

  /* ---- teclado ---- */
  useEffect(() => {
    if (!container) return;

    function aoTeclar(evento: KeyboardEvent) {
      // Não sequestrar teclas de quem está num campo de texto ou num menu.
      const alvo = evento.target as HTMLElement | null;
      if (alvo?.closest("input, textarea, [contenteditable='true']")) return;

      const atalhos: Record<string, () => void> = {
        " ": alternar,
        k: alternar,
        j: () => pular(-PULO_LONGO),
        l: () => pular(PULO_LONGO),
        ArrowLeft: () => pular(-PULO_CURTO),
        ArrowRight: () => pular(PULO_CURTO),
        ArrowUp: () => ajustarVolume((videoRef.current?.volume ?? 0) + 0.1),
        ArrowDown: () => ajustarVolume((videoRef.current?.volume ?? 0) - 0.1),
        m: alternarMudo,
        f: alternarTela,
        c: aoAlternarLegenda,
        p: alternarPip,
      };

      const acao = atalhos[evento.key.length === 1 ? evento.key.toLowerCase() : evento.key];

      // Dígito salta para a fração correspondente da duração (5 → 50%).
      const duracao = videoRef.current?.duration;
      if (!acao && /^[0-9]$/.test(evento.key) && duracao) {
        evento.preventDefault();
        acordar();
        irPara((Number(evento.key) / 10) * duracao);
        return;
      }

      if (!acao) return;
      evento.preventDefault();
      acordar();
      acao();
    }

    container.addEventListener("keydown", aoTeclar);
    return () => container.removeEventListener("keydown", aoTeclar);
  }, [
    container,
    videoRef,
    alternar,
    pular,
    irPara,
    ajustarVolume,
    alternarMudo,
    alternarTela,
    aoAlternarLegenda,
    alternarPip,
    acordar,
  ]);

  /* ---- estado de tela cheia, para trocar o ícone ---- */
  const [emTelaCheia, setEmTelaCheia] = useState(false);
  useEffect(() => {
    function sincronizar() {
      const cheia = document.fullscreenElement === container;
      setEmTelaCheia(cheia);
      // Sair da tela cheia devolve a rotação ao controle do aparelho.
      if (!cheia) liberarOrientacao();
    }

    document.addEventListener("fullscreenchange", sincronizar);
    return () => {
      document.removeEventListener("fullscreenchange", sincronizar);
      liberarOrientacao();
    };
  }, [container]);

  const mostrar = visivel || !midia.tocando || menuAberto !== null;

  return (
    <div
      // Ponteiro some junto com a barra: tela cheia sem cursor por cima do vídeo.
      className={`absolute inset-0 flex flex-col justify-end ${
        mostrar ? "" : "cursor-none"
      }`}
      onPointerMove={acordar}
      onPointerLeave={() => midia.tocando && setMenuAberto(null)}
    >
      {/* Camada de clique: play/pause simples, tela cheia no duplo clique. */}
      <button
        type="button"
        aria-label={midia.tocando ? "Pausar" : "Reproduzir"}
        onClick={alternar}
        onDoubleClick={alternarTela}
        className="absolute inset-0 h-full w-full cursor-default focus-visible:outline-none"
      />

      {/* Indicador central: espera do buffer ou vídeo pausado. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {carregando || midia.esperando ? (
          <span className="h-12 w-12 animate-spin rounded-full border-[3px] border-white/25 border-t-white" />
        ) : (
          !midia.tocando && (
            <span className="animate-surgir flex h-16 w-16 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm sm:h-20 sm:w-20">
              <Icone nome="play" className="ml-1 h-7 w-7 sm:h-9 sm:w-9" />
            </span>
          )
        )}
      </div>

      {/* Título: some junto com os controles. */}
      <div
        aria-hidden="true"
        className={`ease-suave pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-4 pt-3 pb-10 transition-opacity duration-300 sm:px-5 ${
          mostrar ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="line-clamp-1 text-sm font-semibold text-white/95 drop-shadow sm:text-base">
          {titulo}
        </p>
      </div>

      <div
        className={`ease-suave relative flex flex-col gap-1 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-2 pt-10 pb-2 transition-opacity duration-300 sm:px-4 sm:pb-3 ${
          mostrar ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <BarraProgresso
          tempo={midia.tempo}
          duracao={midia.duracao}
          bufferizado={midia.bufferizado}
          aoBuscar={irPara}
        />

        <div className="flex items-center gap-0.5 text-white sm:gap-1">
          <BotaoIcone
            rotulo={midia.tocando ? "Pausar (k)" : "Reproduzir (k)"}
            onClick={alternar}
          >
            <Icone nome={midia.tocando ? "pausa" : "play"} />
          </BotaoIcone>

          <BotaoIcone
            rotulo={`Voltar ${PULO_LONGO} segundos (j)`}
            onClick={() => pular(-PULO_LONGO)}
            className="hidden xs:inline-flex"
          >
            <Icone nome="voltar" />
          </BotaoIcone>

          <BotaoIcone
            rotulo={`Avançar ${PULO_LONGO} segundos (l)`}
            onClick={() => pular(PULO_LONGO)}
            className="hidden xs:inline-flex"
          >
            <Icone nome="avancar" />
          </BotaoIcone>

          <Volume
            volume={midia.mudo ? 0 : midia.volume}
            mudo={midia.mudo}
            aoAlternar={alternarMudo}
            aoAjustar={ajustarVolume}
          />

          <span className="ml-1 text-xs font-medium tabular-nums text-white/90 sm:ml-2 sm:text-[13px]">
            {formatarRelogio(midia.tempo)}
            <span className="text-white/50"> / {formatarRelogio(midia.duracao)}</span>
          </span>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            {temLegenda && (
              <BotaoIcone
                rotulo="Legendas (c)"
                onClick={aoAlternarLegenda}
                ativo={legendaLigada}
              >
                <Icone nome="legenda" />
              </BotaoIcone>
            )}

            <Menu
              rotulo="Velocidade"
              aberto={menuAberto === "velocidade"}
              aoAbrir={(abrir) => setMenuAberto(abrir ? "velocidade" : null)}
              gatilho={
                midia.velocidade === 1 ? (
                  <Icone nome="velocidade" />
                ) : (
                  <span className="text-xs font-bold tabular-nums">
                    {midia.velocidade}×
                  </span>
                )
              }
              opcoes={VELOCIDADES.map((valor) => ({
                chave: String(valor),
                rotulo: valor === 1 ? "Normal" : `${valor}×`,
                ativo: midia.velocidade === valor,
                aoEscolher: () => {
                  const video = videoRef.current;
                  if (video) video.playbackRate = valor;
                },
              }))}
            />

            {qualidades.length > 1 && (
              <Menu
                rotulo="Qualidade"
                aberto={menuAberto === "qualidade"}
                aoAbrir={(abrir) => setMenuAberto(abrir ? "qualidade" : null)}
                gatilho={<Icone nome="ajustes" />}
                opcoes={[
                  {
                    chave: "auto",
                    rotulo: "Automática",
                    ativo: qualidadeAtual === -1,
                    aoEscolher: () => aoTrocarQualidade(-1),
                  },
                  ...qualidades.map((nivel) => ({
                    chave: String(nivel.indice),
                    rotulo: `${nivel.altura}p`,
                    ativo: qualidadeAtual === nivel.indice,
                    aoEscolher: () => aoTrocarQualidade(nivel.indice),
                  })),
                ]}
              />
            )}

            {typeof document !== "undefined" &&
              "pictureInPictureEnabled" in document && (
                <BotaoIcone
                  rotulo="Picture in picture (p)"
                  onClick={alternarPip}
                  className="hidden sm:inline-flex"
                >
                  <Icone nome="pip" />
                </BotaoIcone>
              )}

            <BotaoIcone
              rotulo={emTelaCheia ? "Sair da tela cheia (f)" : "Tela cheia (f)"}
              onClick={alternarTela}
            >
              <Icone nome={emTelaCheia ? "restaurar" : "expandir"} />
            </BotaoIcone>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Gira o aparelho para paisagem ao entrar em tela cheia.
 *
 * Vale só em aparelho de toque: `pointer: coarse` separa celular e tablet de um
 * desktop com tela sensível ao toque, onde travar a orientação do monitor seria
 * um despropósito.
 *
 * A API exige que a tela cheia já esteja ativa — por isso a chamada vem depois
 * da promessa de `requestFullscreen`. E ela **não existe no Safari do iPhone**:
 * ali o `lock` é ausente, a chamada é ignorada em silêncio e o vídeo entra em
 * tela cheia pelo caminho nativo do iOS, que já gira sozinho quando o aparelho
 * está com a rotação liberada.
 */
function travarPaisagem() {
  if (!window.matchMedia?.("(pointer: coarse)").matches) return;

  const orientacao = screen.orientation as ScreenOrientation & {
    lock?: (posicao: string) => Promise<void>;
  };

  void orientacao?.lock?.("landscape").catch(() => {
    // Recusa do navegador não é erro: a pessoa gira o aparelho na mão.
  });
}

function liberarOrientacao() {
  const orientacao = screen.orientation as ScreenOrientation & {
    unlock?: () => void;
  };
  try {
    orientacao?.unlock?.();
  } catch {
    // Alguns navegadores lançam quando nunca houve trava. Sem consequência.
  }
}

/* ------------------------------------------------------------------ */
/* Estado da mídia                                                     */
/* ------------------------------------------------------------------ */

/**
 * Espelha em React o estado do elemento de mídia. O `<video>` continua sendo a
 * fonte da verdade — aqui só reagimos aos eventos dele, para que comandos vindos
 * do teclado, do PiP ou da barra do sistema mantenham a interface em sincronia.
 */
function useMidia(
  videoRef: RefObject<HTMLVideoElement | null>,
  montado: boolean,
) {
  const [estado, setEstado] = useState({
    tocando: false,
    tempo: 0,
    duracao: 0,
    bufferizado: 0,
    volume: 1,
    mudo: false,
    velocidade: 1,
    esperando: false,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const sincronizar = () =>
      setEstado((anterior) => ({
        ...anterior,
        tocando: !video.paused && !video.ended,
        tempo: video.currentTime,
        duracao: Number.isFinite(video.duration) ? video.duration : 0,
        bufferizado: video.buffered.length
          ? video.buffered.end(video.buffered.length - 1)
          : 0,
        volume: video.volume,
        mudo: video.muted,
        velocidade: video.playbackRate,
      }));

    const esperando = (valor: boolean) => () =>
      setEstado((anterior) => ({ ...anterior, esperando: valor }));

    const eventos: [string, EventListener][] = [
      ["play", sincronizar],
      ["pause", sincronizar],
      ["ended", sincronizar],
      ["timeupdate", sincronizar],
      ["progress", sincronizar],
      ["durationchange", sincronizar],
      ["loadedmetadata", sincronizar],
      ["volumechange", sincronizar],
      ["ratechange", sincronizar],
      ["waiting", esperando(true)],
      ["playing", esperando(false)],
      ["canplay", esperando(false)],
    ];

    for (const [nome, ouvinte] of eventos) video.addEventListener(nome, ouvinte);
    sincronizar();

    return () => {
      for (const [nome, ouvinte] of eventos)
        video.removeEventListener(nome, ouvinte);
    };
    // `montado` é o gatilho: a ref sozinha não avisa quando o elemento chega.
  }, [videoRef, montado]);

  return estado;
}

/** Mostra os controles e os esconde após um período parado, só se estiver tocando. */
function useVisibilidade(tocando: boolean) {
  const [visivel, setVisivel] = useState(true);
  const relogio = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const acordar = useCallback(() => {
    setVisivel(true);
    clearTimeout(relogio.current);
    relogio.current = setTimeout(() => setVisivel(false), MS_ATE_OCULTAR);
  }, []);

  /*
   * Parado, nada some — quem consome já força a barra visível quando não está
   * tocando, então aqui basta desarmar o relógio. Tocando, o desaparecimento é
   * agendado; escrever estado direto no corpo do efeito provocaria uma cascata
   * de renders, e o `setVisivel` só acontece dentro do callback do timer.
   */
  useEffect(() => {
    if (!tocando) {
      clearTimeout(relogio.current);
      return;
    }
    relogio.current = setTimeout(() => setVisivel(false), MS_ATE_OCULTAR);
    return () => clearTimeout(relogio.current);
  }, [tocando]);

  return { visivel, acordar };
}

/* ------------------------------------------------------------------ */
/* Barra de progresso                                                  */
/* ------------------------------------------------------------------ */

function BarraProgresso({
  tempo,
  duracao,
  bufferizado,
  aoBuscar,
}: {
  tempo: number;
  duracao: number;
  bufferizado: number;
  aoBuscar: (segundos: number) => void;
}) {
  const trilho = useRef<HTMLDivElement>(null);
  const [arrastando, setArrastando] = useState(false);
  const [previa, setPrevia] = useState<number | null>(null);

  const segundosNoPonto = useCallback(
    (clienteX: number) => {
      const area = trilho.current?.getBoundingClientRect();
      if (!area || duracao <= 0) return 0;
      const fracao = (clienteX - area.left) / area.width;
      return Math.min(Math.max(fracao, 0), 1) * duracao;
    },
    [duracao],
  );

  /*
   * O arrasto é seguido no documento, não no trilho: sair da barra com o botão
   * pressionado é o gesto normal de quem procura uma cena, e perder o evento
   * ali deixaria o indicador preso no meio do caminho.
   */
  useEffect(() => {
    if (!arrastando) return;

    const mover = (evento: PointerEvent) => {
      const segundos = segundosNoPonto(evento.clientX);
      setPrevia(segundos);
      aoBuscar(segundos);
    };
    const soltar = () => setArrastando(false);

    document.addEventListener("pointermove", mover);
    document.addEventListener("pointerup", soltar);
    document.addEventListener("pointercancel", soltar);
    return () => {
      document.removeEventListener("pointermove", mover);
      document.removeEventListener("pointerup", soltar);
      document.removeEventListener("pointercancel", soltar);
    };
  }, [arrastando, segundosNoPonto, aoBuscar]);

  const pct = (valor: number) => (duracao > 0 ? (valor / duracao) * 100 : 0);
  const mostrado = arrastando && previa !== null ? previa : tempo;

  return (
    <div
      ref={trilho}
      role="slider"
      tabIndex={0}
      aria-label="Linha do tempo"
      aria-valuemin={0}
      aria-valuemax={Math.round(duracao)}
      aria-valuenow={Math.round(mostrado)}
      aria-valuetext={`${formatarRelogio(mostrado)} de ${formatarRelogio(duracao)}`}
      onPointerDown={(evento) => {
        setArrastando(true);
        const segundos = segundosNoPonto(evento.clientX);
        setPrevia(segundos);
        aoBuscar(segundos);
      }}
      onPointerMove={(evento) => {
        if (!arrastando) setPrevia(segundosNoPonto(evento.clientX));
      }}
      onPointerLeave={() => !arrastando && setPrevia(null)}
      className="group focus-visible:outline-acento relative flex h-5 cursor-pointer touch-none items-center focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {/* Trilho: engrossa no hover, como nos players de streaming. */}
      <div className="ease-suave relative h-[3px] w-full rounded-full bg-white/25 transition-[height] duration-150 group-hover:h-[5px]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white/35"
          style={{ width: `${pct(bufferizado)}%` }}
        />
        <div
          className="bg-acento-claro absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct(mostrado)}%` }}
        />
        <span
          className={`bg-acento-claro ease-suave absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow transition-transform duration-150 ${
            arrastando ? "scale-100" : "scale-0 group-hover:scale-100"
          }`}
          style={{ left: `${pct(mostrado)}%` }}
        />
      </div>

      {previa !== null && duracao > 0 && (
        <span
          className="pointer-events-none absolute bottom-6 -translate-x-1/2 rounded bg-black/85 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white"
          style={{ left: `${pct(previa)}%` }}
        >
          {formatarRelogio(previa)}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Volume                                                              */
/* ------------------------------------------------------------------ */

function Volume({
  volume,
  mudo,
  aoAlternar,
  aoAjustar,
}: {
  volume: number;
  mudo: boolean;
  aoAlternar: () => void;
  aoAjustar: (valor: number) => void;
}) {
  return (
    // A régua nasce com largura zero e cresce no hover/foco, para não roubar
    // espaço da barra inteira no celular.
    <div className="group/vol flex items-center">
      <BotaoIcone
        rotulo={mudo || volume === 0 ? "Ativar som (m)" : "Silenciar (m)"}
        onClick={aoAlternar}
      >
        <Icone nome={mudo || volume === 0 ? "mudo" : volume < 0.5 ? "som-baixo" : "som"} />
      </BotaoIcone>

      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        aria-label="Volume"
        onChange={(evento) => aoAjustar(Number(evento.target.value))}
        style={{ ["--preenchido" as string]: `${volume * 100}%` }}
        className="regua-volume ease-suave w-0 opacity-0 transition-[width,opacity] duration-200 group-hover/vol:w-16 group-hover/vol:opacity-100 focus:w-16 focus:opacity-100 sm:group-hover/vol:w-20"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Peças reutilizáveis                                                 */
/* ------------------------------------------------------------------ */

function BotaoIcone({
  rotulo,
  onClick,
  children,
  ativo = false,
  className = "",
}: {
  rotulo: string;
  onClick: () => void;
  children: ReactNode;
  ativo?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      onClick={onClick}
      className={`ease-suave inline-flex h-9 w-9 items-center justify-center rounded-lg transition-[background-color,color,transform] duration-150 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white active:scale-90 ${
        ativo ? "text-acento-claro" : "text-white"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Menu({
  rotulo,
  gatilho,
  opcoes,
  aberto,
  aoAbrir,
}: {
  rotulo: string;
  gatilho: ReactNode;
  opcoes: {
    chave: string;
    rotulo: string;
    ativo: boolean;
    aoEscolher: () => void;
  }[];
  aberto: boolean;
  aoAbrir: (abrir: boolean) => void;
}) {
  return (
    <div className="relative">
      <BotaoIcone
        rotulo={rotulo}
        onClick={() => aoAbrir(!aberto)}
        ativo={aberto}
      >
        {gatilho}
      </BotaoIcone>

      {aberto && (
        <div
          role="menu"
          aria-label={rotulo}
          className="animate-surgir absolute right-0 bottom-11 min-w-[9rem] overflow-hidden rounded-xl bg-black/90 py-1 shadow-xl ring-1 ring-white/15 backdrop-blur-sm"
        >
          <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-white/45 uppercase">
            {rotulo}
          </p>
          {opcoes.map((opcao) => (
            <button
              key={opcao.chave}
              type="button"
              role="menuitemradio"
              aria-checked={opcao.ativo}
              onClick={() => {
                opcao.aoEscolher();
                aoAbrir(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-white/10 ${
                opcao.ativo ? "text-acento-claro font-semibold" : "text-white/90"
              }`}
            >
              <span className="w-3.5">{opcao.ativo ? "✓" : ""}</span>
              {opcao.rotulo}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ícones                                                              */
/* ------------------------------------------------------------------ */

const TRACADOS: Record<string, ReactNode> = {
  play: <path d="M6 4.5v15l13-7.5-13-7.5Z" fill="currentColor" stroke="none" />,
  pausa: (
    <>
      <rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  voltar: (
    <>
      <path d="M11 5 4 12l7 7" />
      <path d="M20 5l-7 7 7 7" />
    </>
  ),
  avancar: (
    <>
      <path d="M13 5l7 7-7 7" />
      <path d="M4 5l7 7-7 7" />
    </>
  ),
  som: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4Z" />
      <path d="M16 9a4 4 0 0 1 0 6" />
      <path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  "som-baixo": (
    <>
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4Z" />
      <path d="M16 9a4 4 0 0 1 0 6" />
    </>
  ),
  mudo: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4Z" />
      <path d="m16.5 9.5 5 5M21.5 9.5l-5 5" />
    </>
  ),
  legenda: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M7.5 13.5h3M13.5 13.5h3" />
    </>
  ),
  velocidade: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  ajustes: (
    <>
      <circle cx="12" cy="12" r="2.8" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" />
    </>
  ),
  pip: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <rect x="12" y="11.5" width="7" height="6" rx="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  expandir: <path d="M9 4H4v5M15 4h5v5M15 20h5v-5M9 20H4v-5" />,
  restaurar: <path d="M4 9h5V4M20 9h-5V4M20 15h-5v5M4 15h5v5" />,
};

function Icone({ nome, className = "h-5 w-5" }: { nome: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {TRACADOS[nome]}
    </svg>
  );
}
