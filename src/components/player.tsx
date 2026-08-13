"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Hls from "hls.js";
import type { VimeoFonte } from "@/types/api";
import { ControlesPlayer, type Qualidade } from "@/components/controles-player";

/** Legenda já com a URL apontando para o nosso proxy autenticado. */
type Legenda = {
  id: string;
  label: string;
  language: string;
  kind: string;
  src: string;
};

type Estado = "carregando" | "pronto" | "erro";

/** A cada quantos segundos de reprodução o progresso é enviado à API. */
const INTERVALO_PING = 15;
/** Fração do vídeo a partir da qual ele conta como concluído. */
const LIMIAR_CONCLUSAO = 0.95;

/** Altura em pixels declarada em `quality` ("1080p" → 1080). Serve para ordenar. */
function altura(qualidade: string | undefined) {
  const numero = Number.parseInt(qualidade ?? "", 10);
  return Number.isNaN(numero) ? 0 : numero;
}

export function Player({
  vimeoId,
  videoId,
  segundosIniciais = 0,
  titulo,
  autoIniciar = true,
  aoFinalizar,
  trilhaId = null,
  trailItemId = null,
}: {
  vimeoId: string;
  /** ID do vídeo no banco — é ele que o endpoint de progresso espera. */
  videoId: number | null;
  segundosIniciais?: number;
  titulo: string;
  /** Começa a tocar assim que a fonte fica pronta. */
  autoIniciar?: boolean;
  /**
   * Avisa que o vídeo chegou ao fim. Quem consome decide o que fazer — no
   * modal, é o gatilho da contagem para a próxima aula.
   */
  aoFinalizar?: () => void;
  /**
   * Contexto da trilha. O backend mantém o progresso da trilha separado do
   * progresso global do vídeo, então quando a aula é aberta por dentro de uma
   * trilha precisamos avisar os dois endpoints.
   */
  trilhaId?: number | null;
  trailItemId?: number | null;
}) {
  /*
   * O elemento é guardado nos dois formatos de propósito:
   *
   * - `videoRef` é o canal de escrita. Os controles são um componente irmão e
   *   mutam o nó (tempo, volume, velocidade); o React Compiler proíbe mutar
   *   props, e a ref é a via prevista para isso.
   * - `video` em estado existe para disparar render. Uma ref não avisa ninguém
   *   quando o elemento monta, e sem esse sinal os efeitos daqui e dos
   *   controles nunca reassinariam.
   */
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  const guardarVideo = useCallback((elemento: HTMLVideoElement | null) => {
    videoRef.current = elemento;
    setVideo(elemento);
  }, []);

  /* Sinal de montagem: é o que faz os efeitos abaixo reassinarem no elemento. */
  const montado = video !== null;

  const [estado, setEstado] = useState<Estado>("carregando");
  const [mensagemErro, setMensagemErro] = useState("");
  const [legendas, setLegendas] = useState<Legenda[]>([]);
  const [qualidades, setQualidades] = useState<Qualidade[]>([]);
  const [qualidadeAtual, setQualidadeAtual] = useState(-1);

  const hlsRef = useRef<Hls | null>(null);
  const ultimoEnvio = useRef(0);
  const concluidoEnviado = useRef(false);

  /*
   * Troca para a próxima fonte disponível e devolve `true` se conseguiu. O
   * ouvinte de erro do <video> chama isto antes de desistir, para que uma
   * renderização quebrada desça um degrau em vez de derrubar a aula.
   */
  const proximaFonte = useRef<(() => boolean) | null>(null);

  const [legendaLigada, setLegendaLigada] = useState(false);
  /** O autoplay só passou porque silenciamos o vídeo — precisa ser dito. */
  const [somBloqueado, setSomBloqueado] = useState(false);

  /*
   * Liga e desliga todas as faixas de uma vez. Fica aqui, e não nos controles,
   * porque é este componente que renderiza os <track>: as faixas pertencem ao
   * elemento dele.
   *
   * `TextTrack.mode` é a única forma de exibir ou esconder uma legenda — o DOM
   * não expõe nada declarativo, e o React não tem prop equivalente. Por isso a
   * regra de imutabilidade é dispensada nesta linha: o alvo é um nó do DOM, não
   * estado de React.
   */
  const alternarLegenda = useCallback(() => {
    const faixas = videoRef.current?.textTracks;
    if (!faixas?.length) return;

    const ligada = faixas[0].mode === "showing";
    for (let i = 0; i < faixas.length; i += 1) {
      // eslint-disable-next-line react-hooks/immutability -- ver comentário acima
      faixas[i].mode = ligada ? "disabled" : "showing";
    }
    setLegendaLigada(!ligada);
  }, []);

  const trocarQualidade = useCallback((indice: number) => {
    setQualidadeAtual(indice);
    // -1 devolve o controle ao algoritmo adaptativo do hls.js.
    if (hlsRef.current) hlsRef.current.currentLevel = indice;
  }, []);

  const enviarProgresso = useCallback(
    (segundos: number, concluido: boolean) => {
      if (videoId === null) return;
      const inteiro = Math.floor(segundos);

      /*
       * Ping em 0:00 não informa nada e é um candidato natural a ser recusado
       * pela validação da API. Ele acontece de verdade: o evento `pause` chega
       * antes de o vídeo sair do zero quando a pessoa dá play e pausa em
       * seguida, ou quando a fonte é trocada.
       */
      if (inteiro <= 0 && !concluido) return;

      // keepalive garante o envio mesmo se a aba for fechada em seguida.
      void fetch("/api/progresso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, segundos: inteiro, concluido }),
        keepalive: true,
      }).catch(() => {
        // Progresso é acessório: uma falha aqui não interrompe a reprodução.
      });

      // Assistir por dentro de uma trilha também avança a barra dela.
      if (trilhaId !== null && trailItemId !== null) {
        void fetch(`/api/trilhas/${trilhaId}/progresso`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trailItemId,
            videoId,
            segundos: inteiro,
            concluido,
          }),
          keepalive: true,
        }).catch(() => {});
      }
    },
    [videoId, trilhaId, trailItemId],
  );

  /* ---- carrega a fonte ---- */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelado = false;
    let limparHls: (() => void) | undefined;

    async function carregar() {
      try {
        const resposta = await fetch(`/api/video/${vimeoId}/link`);
        if (!resposta.ok) {
          const corpo = (await resposta.json().catch(() => ({}))) as {
            erro?: string;
          };
          throw new Error(corpo.erro ?? "Não foi possível carregar o vídeo.");
        }

        const {
          url,
          sources = [],
          legendas: faixas = [],
        } = (await resposta.json()) as {
          url?: string;
          sources?: VimeoFonte[];
          legendas?: Legenda[];
        };
        if (cancelado || !video) return;

        setLegendas(faixas);
        /*
         * O <track> abaixo marca `default` na primeira faixa em português, e o
         * navegador já a exibe. O botão precisa nascer aceso nesse caso, senão
         * o primeiro clique "desliga" algo que a interface mostrava apagado.
         */
        setLegendaLigada(faixas[0]?.language.startsWith("pt") ?? false);

        /*
         * O formato vem do `type` declarado em `sources` — é o dado confiável.
         * A inferência pelo caminho só entra quando a API devolve apenas `url`,
         * e aí "não é mp4" é o teste certo: os dois formatos trazem a extensão
         * antes da query (`/hls.m3u8?s=…` e `/file.mp4?loc=…`), mas o
         * progressivo repete `.mp4` no meio do nome, então procurar `.m3u8`
         * daria falso negativo em URLs de streaming com sufixo diferente.
         */
        const ehMp4 = (endereco: string) => /\.mp4(\?|#|$)/i.test(endereco);

        const linkHls =
          sources.find((fonte) => fonte.type === "hls")?.url ??
          (url && !ehMp4(url) ? url : null);

        /*
         * Fila de MP4 progressivos, do melhor para o pior. A API devolve cinco
         * renderizações; guardar todas permite descer de qualidade quando uma
         * falha, em vez de mostrar erro na primeira tentativa frustrada.
         */
        const filaMp4 = sources
          .filter((fonte) => fonte.type === "mp4")
          .sort((a, b) => altura(b.quality) - altura(a.quality))
          .map((fonte) => fonte.url);

        if (url && ehMp4(url) && !filaMp4.includes(url)) filaMp4.push(url);

        function usarMp4() {
          const proximo = filaMp4.shift();
          if (!proximo || !video) return false;
          limparHls?.();
          limparHls = undefined;
          hlsRef.current = null;
          // Sem manifesto não há troca de nível: o menu de qualidade some.
          setQualidades([]);
          video.src = proximo;
          video.load();
          setEstado("pronto");
          return true;
        }

        proximaFonte.current = usarMp4;

        if (linkHls) {
          const { default: Hls } = await import("hls.js");
          if (cancelado) return;

          /*
           * hls.js SEMPRE que houver MSE — Chrome, Firefox, Edge e o Safari de
           * desktop. O caminho nativo fica reservado a quem não tem MSE, na
           * prática o Safari do iOS.
           *
           * A ordem inversa era o bug desta tela: `canPlayType` devolve string
           * não-vazia em navegadores que aceitam o *tipo* mas não decodificam
           * um manifesto entregue por `video.src`. O elemento então rejeitava a
           * fonte com MEDIA_ERR_SRC_NOT_SUPPORTED — o "formato deste vídeo não
           * é suportado" que aparecia no lugar da aula. Testar MSE primeiro
           * torna esse caminho inalcançável para quem tem a biblioteca.
           */
          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              /*
               * As legendas já entram como <track> vindo do nosso proxy; deixar
               * o hls.js publicar também as do manifesto duplicaria o menu.
               */
              renderTextTracksNatively: false,
              /*
               * Retomar sob MSE precisa acontecer AQUI, não com um
               * `video.currentTime` depois do `loadedmetadata`: naquele momento
               * o buffer ainda está vazio, o seek é limitado ao intervalo
               * disponível (zero) e a aula recomeça do início. O
               * `startPosition` faz o hls.js buscar já o fragmento certo.
               * `-1` é o padrão da biblioteca e significa "início do stream".
               */
              startPosition: segundosIniciais > 0 ? segundosIniciais : -1,
            });

            let tentouRede = false;
            let tentouMidia = false;

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (cancelado) return;
              // Da melhor para a pior, como no menu de qualidade.
              setQualidades(
                hls.levels
                  .map((nivel, indice) => ({ indice, altura: nivel.height }))
                  .filter((nivel) => nivel.altura > 0)
                  .sort((a, b) => b.altura - a.altura),
              );
            });

            hls.on(Hls.Events.ERROR, (_evento, dados) => {
              if (!dados.fatal) return;

              // Falha fatal tem recuperação prevista pela própria biblioteca;
              // só depois de esgotá-la é que trocamos de estratégia.
              if (dados.type === Hls.ErrorTypes.NETWORK_ERROR && !tentouRede) {
                tentouRede = true;
                hls.startLoad();
                return;
              }

              if (dados.type === Hls.ErrorTypes.MEDIA_ERROR && !tentouMidia) {
                tentouMidia = true;
                hls.recoverMediaError();
                return;
              }

              if (usarMp4()) return;

              setEstado("erro");
              setMensagemErro(
                "A transmissão falhou. Recarregue a página ou tente outra aula.",
              );
            });

            hls.loadSource(linkHls);
            hls.attachMedia(video);
            hlsRef.current = hls;
            limparHls = () => hls.destroy();
            setEstado("pronto");
            return;
          }

          if (video.canPlayType("application/vnd.apple.mpegurl") !== "") {
            video.src = linkHls;
            setEstado("pronto");
            return;
          }
        }

        if (!usarMp4()) throw new Error("Nenhuma fonte de vídeo disponível.");
      } catch (erro) {
        if (cancelado) return;
        setEstado("erro");
        setMensagemErro(
          erro instanceof Error ? erro.message : "Não foi possível carregar o vídeo.",
        );
      }
    }

    void carregar();

    return () => {
      cancelado = true;
      proximaFonte.current = null;
      hlsRef.current = null;
      limparHls?.();
    };
    // `segundosIniciais` entra aqui porque decide o `startPosition` do hls.js.
  }, [vimeoId, montado, segundosIniciais]);

  /* ---- falhas do próprio elemento de mídia ---- */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    /*
     * Sem este ouvinte, uma fonte que o navegador não consegue decodificar
     * deixa o player preto em 0:00, sem nenhum aviso.
     */
    function aoFalhar() {
      // Ainda resta renderização na fila? Troca em silêncio e segue tocando.
      if (proximaFonte.current?.()) return;

      const codigo = video?.error?.code;
      setEstado("erro");
      setMensagemErro(
        codigo === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
          ? "O formato deste vídeo não é suportado pelo seu navegador."
          : "A reprodução falhou. Verifique sua conexão e tente de novo.",
      );
    }

    video.addEventListener("error", aoFalhar);
    return () => video.removeEventListener("error", aoFalhar);
  }, [montado]);

  /* ---- início automático ---- */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoIniciar || estado !== "pronto") return;

    let cancelado = false;

    async function iniciar() {
      if (!video) return;

      try {
        await video.play();
        return;
      } catch {
        // Bloqueado com som: é a política de autoplay, não uma falha do vídeo.
      }

      if (cancelado || !video) return;

      /*
       * Sem áudio o autoplay é sempre permitido. Preferimos a aula rodando
       * muda, com um aviso para reativar o som em um clique, a uma tela parada
       * — mas só depois de tentar com som, que é o que a maioria dos
       * navegadores libera para quem já assistiu antes no mesmo domínio.
       */
      video.muted = true;
      try {
        await video.play();
        if (!cancelado) setSomBloqueado(true);
      } catch {
        // Nem mudo: resta o botão central de play, e o som volta ao normal.
        if (!cancelado) video.muted = false;
      }
    }

    void iniciar();
    return () => {
      cancelado = true;
    };
  }, [autoIniciar, estado]);

  /*
   * O aviso some assim que o áudio volta por qualquer caminho — o botão daqui,
   * o de volume nos controles ou a tecla `m`. Sem isto ele continuaria na tela
   * pedindo para ativar um som que já está ligado.
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !somBloqueado) return;

    function verificar() {
      if (video && !video.muted) setSomBloqueado(false);
    }

    video.addEventListener("volumechange", verificar);
    return () => video.removeEventListener("volumechange", verificar);
  }, [somBloqueado, montado]);

  const ativarSom = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    if (video.volume === 0) video.volume = 1;
    setSomBloqueado(false);
  }, []);

  /*
   * Fim da reprodução. Fica num efeito próprio, e não junto do envio de
   * progresso: aquele depende de `videoId` e `trilhaId`, e amarrar o callback
   * do pai ali faria a assinatura toda ser refeita a cada render dele.
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !aoFinalizar) return;

    function terminou() {
      aoFinalizar?.();
    }

    video.addEventListener("ended", terminou);
    return () => video.removeEventListener("ended", terminou);
  }, [aoFinalizar, montado]);

  /* ---- retoma de onde parou ---- */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || estado !== "pronto" || segundosIniciais <= 0) return;

    function retomar() {
      if (video && video.currentTime < 1) video.currentTime = segundosIniciais;
    }

    video.addEventListener("loadedmetadata", retomar, { once: true });
    if (video.readyState >= 1) retomar();

    return () => video.removeEventListener("loadedmetadata", retomar);
  }, [estado, segundosIniciais, montado]);

  /* ---- reporta progresso ---- */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoId === null) return;

    function aoAvancar() {
      if (!video) return;
      const atual = video.currentTime;

      if (atual - ultimoEnvio.current >= INTERVALO_PING) {
        ultimoEnvio.current = atual;
        enviarProgresso(atual, false);
      }

      if (
        !concluidoEnviado.current &&
        video.duration > 0 &&
        atual / video.duration >= LIMIAR_CONCLUSAO
      ) {
        concluidoEnviado.current = true;
        enviarProgresso(atual, true);
      }
    }

    function aoPausar() {
      if (!video) return;
      ultimoEnvio.current = video.currentTime;
      enviarProgresso(video.currentTime, false);
    }

    function aoTerminar() {
      if (!video || concluidoEnviado.current) return;
      concluidoEnviado.current = true;
      enviarProgresso(video.duration || video.currentTime, true);
    }

    video.addEventListener("timeupdate", aoAvancar);
    video.addEventListener("pause", aoPausar);
    video.addEventListener("ended", aoTerminar);

    return () => {
      video.removeEventListener("timeupdate", aoAvancar);
      video.removeEventListener("pause", aoPausar);
      video.removeEventListener("ended", aoTerminar);
      // Grava a posição ao sair da página.
      if (video.currentTime > 0 && !video.ended) {
        enviarProgresso(video.currentTime, false);
      }
    };
  }, [enviarProgresso, videoId, montado]);

  return (
    <div
      ref={setContainer}
      // `tabIndex` torna o container focável, que é o que permite capturar os
      // atalhos de teclado sem instalar um ouvinte global na página.
      tabIndex={-1}
      /*
       * Sem borda e com fundo preto. Eram duas fontes de branco: a borda em si
       * e o `bg-fundo-2` (#eaf1f8, quase branco), que vazava pelas quinas
       * arredondadas e por qualquer faixa não coberta pelo vídeo. Preto resolve
       * as duas — e o quadro já se separa sozinho do fundo claro da página.
       */
      className="group/player relative aspect-video w-full overflow-hidden bg-black outline-none sm:rounded-xl"
    >
      <video
        ref={guardarVideo}
        playsInline
        preload="metadata"
        aria-label={titulo}
        className="h-full w-full bg-black"
      >
        {legendas.map((faixa, indice) => (
          <track
            key={faixa.id}
            kind="subtitles"
            src={faixa.src}
            srcLang={faixa.language}
            label={faixa.label}
            default={indice === 0 && faixa.language.startsWith("pt")}
          />
        ))}
      </video>

      {estado !== "erro" && (
        <ControlesPlayer
          videoRef={videoRef}
          montado={video !== null}
          container={container}
          titulo={titulo}
          qualidades={qualidades}
          qualidadeAtual={qualidadeAtual}
          aoTrocarQualidade={trocarQualidade}
          temLegenda={legendas.length > 0}
          legendaLigada={legendaLigada}
          aoAlternarLegenda={alternarLegenda}
          carregando={estado === "carregando"}
        />
      )}

      {/*
        Fica acima dos controles no DOM para receber o clique mesmo quando a
        barra está visível — é a única forma de recuperar o áudio sem que a
        pessoa precise adivinhar que o vídeo começou mudo.
      */}
      {somBloqueado && estado !== "erro" && (
        <button
          type="button"
          onClick={ativarSom}
          className="animate-surgir bg-acento text-white hover:bg-acento-hover absolute top-3 right-3 z-10 flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold shadow-lg transition-colors sm:text-sm"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4Z" />
            <path d="m16.5 9.5 5 5M21.5 9.5l-5 5" />
          </svg>
          Ativar som
        </button>
      )}

      {estado === "erro" && (
        <div className="bg-fundo-2 animate-surgir absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-texto font-semibold">Não foi possível reproduzir</p>
          <p className="text-texto-3 max-w-sm text-sm">{mensagemErro}</p>
        </div>
      )}
    </div>
  );
}
