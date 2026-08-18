"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type Hls from "hls.js";
import { resolverFonteVimeo } from "@/lib/fonte-video";

/** Episódio como a playlist o conhece — sem nada que exija o `findOne`. */
export type Episodio = {
  conteudoId: number;
  convidado: string;
  tema: string | null;
  capa: string | null;
  /** Segundos, vindos da listagem. */
  duracao: number;
  publicadoEm: string | null;
};

export type ModoPodcast = "audio" | "video";

type Reprodutor = {
  episodio: Episodio | null;
  fila: Episodio[];
  tocando: boolean;
  carregando: boolean;
  erro: string | null;
  /** Segundos decorridos e totais, já do elemento — não da listagem. */
  tempo: number;
  duracao: number;
  velocidade: number;
  modo: ModoPodcast;
  abrir: (episodio: Episodio, fila: Episodio[]) => void;
  alternar: () => void;
  irPara: (segundos: number) => void;
  pular: (delta: number) => void;
  definirVelocidade: (valor: number) => void;
  definirModo: (valor: ModoPodcast) => void;
  proximo: () => void;
  fechar: () => void;
  /**
   * Identificadores de reprodução do episódio no ar, resolvidos pelo provedor.
   * É o que a página entrega ao <Player> quando entra em modo vídeo.
   */
  midia: { videoId: number; vimeoId: string; segundos: number } | null;
  /** Cede a vez: pausa o áudio e devolve o ponto em que ele estava. */
  cederPara: () => number;
  /** Retoma o áudio a partir de um ponto — a volta do modo vídeo. */
  retomarEm: (segundos: number, tocando: boolean) => void;
  /**
   * Se a página do podcast está em cena. É o que o mini player consulta para
   * saber se deve aparecer — ele existe justamente para quando ela NÃO está.
   */
  naPagina: boolean;
  registrarPagina: (aberta: boolean) => void;
};

const ContextoPodcast = createContext<Reprodutor | null>(null);

/** A cada quantos segundos de reprodução o progresso é enviado à API. */
const INTERVALO_PING = 15;
/** Fração a partir da qual o episódio conta como concluído. */
const LIMIAR_CONCLUSAO = 0.95;

export function useReprodutorPodcast() {
  const contexto = useContext(ContextoPodcast);
  if (!contexto) {
    throw new Error("useReprodutorPodcast precisa do ProvedorPodcast acima.");
  }
  return contexto;
}

/**
 * Guarda o elemento de mídia do podcast FORA da árvore das páginas.
 *
 * Esta é a razão de o provedor existir e de viver no layout: um `<video>`
 * desmontado para a reprodução. Se o elemento pertencesse à página, sair dela
 * mataria o áudio — e o mini player do rodapé seria impossível. Aqui ele monta
 * uma vez e só muda de lugar na tela.
 */
export function ProvedorPodcast({ children }: { children: React.ReactNode }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [naPagina, setNaPagina] = useState(false);
  const [midia, setMidia] = useState<{
    videoId: number;
    vimeoId: string;
    /** Onde a pessoa parou, segundo a API. Ponto de partida de quem tocar. */
    segundos: number;
  } | null>(null);

  const [episodio, setEpisodio] = useState<Episodio | null>(null);
  const [fila, setFila] = useState<Episodio[]>([]);
  const [tocando, setTocando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tempo, setTempo] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [velocidade, setVelocidade] = useState(1);
  const [modo, setModo] = useState<ModoPodcast>("audio");

  /* ---- progresso ---- */

  const videoIdRef = useRef<number | null>(null);
  const ultimoPing = useRef(0);

  const enviarProgresso = useCallback((segundos: number, concluido: boolean) => {
    const videoId = videoIdRef.current;
    if (!videoId) return;

    /*
     * `keepalive` porque este envio acontece também ao trocar de episódio e ao
     * fechar a aba: sem ele o navegador cancela a requisição em voo e o ponto
     * de parada se perde justamente na hora que mais importa.
     */
    void fetch("/api/progresso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, segundos: Math.floor(segundos), concluido }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  /* ---- carga da fonte ---- */

  /*
   * Onde retomar e se deve tocar ao anexar. São refs porque quem as escreve
   * (um clique, a volta do modo vídeo) não é quem as lê (o efeito de anexação,
   * um tick depois) — e nenhuma das duas deve provocar render.
   */
  const posicaoRef = useRef(0);
  const deveTocarRef = useRef(false);
  /*
   * A velocidade é lida pela anexação, mas não pode ser dependência dela:
   * mudar de 1x para 1,5x recarregaria a fonte. A ref é sincronizada por
   * efeito — escrevê-la no corpo do componente seria escrita durante o render.
   */
  const velocidadeRef = useRef(velocidade);
  useEffect(() => {
    velocidadeRef.current = velocidade;
  }, [velocidade]);

  const abrir = useCallback(
    (alvo: Episodio, novaFila: Episodio[]) => {
      setFila(novaFila);
      setErro(null);
      deveTocarRef.current = true;

      // Reabrir o episódio que já está no ar é só um play.
      if (episodio?.conteudoId === alvo.conteudoId) {
        /*
         * ...mas SÓ em modo áudio. Em vídeo quem reproduz é o <Player> da
         * página; dar play aqui poria os dois no ar ao mesmo tempo.
         */
        if (modo === "audio") {
          videoRef.current?.play().catch(() => setTocando(false));
        }
        return;
      }

      posicaoRef.current = 0;
      setMidia(null);
      setEpisodio(alvo);
      setCarregando(true);
      setTempo(0);
      setDuracao(alvo.duracao);
    },
    [episodio, modo],
  );

  /*
   * Etapa 1 — identificar o episódio.
   *
   * Só descobre `videoId`/`vimeoId` e o ponto salvo. Fica separada da anexação
   * porque esses dados servem aos DOIS modos: em vídeo é o que a página
   * entrega ao <Player>, sem que uma única fonte seja anexada aqui.
   */
  useEffect(() => {
    if (!episodio) return;

    let cancelado = false;

    async function identificar() {
      if (!episodio) return;

      try {
        const resposta = await fetch(`/api/podcast/${episodio.conteudoId}`);
        if (!resposta.ok) {
          const corpo = (await resposta.json().catch(() => ({}))) as {
            erro?: string;
          };
          throw new Error(corpo.erro ?? "Não foi possível abrir o episódio.");
        }

        const dados = (await resposta.json()) as {
          videoId: number;
          vimeoId: string;
          segundos: number;
          duracao: number;
        };
        if (cancelado) return;

        videoIdRef.current = dados.videoId;
        ultimoPing.current = dados.segundos;
        posicaoRef.current = dados.segundos;
        setMidia({
          videoId: dados.videoId,
          vimeoId: dados.vimeoId,
          segundos: dados.segundos,
        });
      } catch (falha) {
        if (cancelado) return;
        setCarregando(false);
        setErro(
          falha instanceof Error ? falha.message : "Falha ao abrir o episódio.",
        );
      }
    }

    void identificar();

    return () => {
      cancelado = true;
    };
  }, [episodio]);

  /*
   * Etapa 2 — anexar a fonte, e SÓ em modo áudio.
   *
   * Esta é a regra que impede dois episódios no ar: o elemento daqui só tem
   * fonte quando ele é quem reproduz. Em modo vídeo o dono é o <Player> da
   * página, e aqui não fica nem stream baixando.
   *
   * A limpeza é o outro lado da mesma moeda. Antes ela só marcava
   * `cancelado`, e a fonte anterior seguia tocando durante os dois `await` da
   * próxima carga — clicar rápido pela playlist empilhava episódios.
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!midia || modo !== "audio") {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.pause();
      video.removeAttribute("src");
      video.load();
      return;
    }

    let cancelado = false;

    async function anexar() {
      if (!video || !midia) return;

      try {
        const { linkHls, filaMp4 } = await resolverFonteVimeo(midia.vimeoId);
        if (cancelado) return;

        if (linkHls) {
          const { default: Hls } = await import("hls.js");
          if (cancelado) return;

          if (Hls.isSupported()) {
            const hls = new Hls({ enableWorker: true });
            hls.loadSource(linkHls);
            hls.attachMedia(video);
            hlsRef.current = hls;
          } else {
            // Sem MSE (Safari do iOS) o próprio elemento lê o manifesto.
            video.src = linkHls;
          }
        } else if (filaMp4.length > 0) {
          video.src = filaMp4[0];
        } else {
          throw new Error("Nenhuma fonte disponível para este episódio.");
        }

        if (posicaoRef.current > 0) video.currentTime = posicaoRef.current;
        video.playbackRate = velocidadeRef.current;
        setCarregando(false);

        /*
         * A política de autoplay REJEITA esta promessa quando o gesto do
         * usuário já expirou — a carga tem dois `await` pelo caminho. Sem o
         * catch, vira erro não tratado no console; com ele, a tela volta ao
         * estado pausado e o play manual funciona.
         */
        if (deveTocarRef.current) {
          video.play().catch(() => setTocando(false));
        }
      } catch (falha) {
        if (cancelado) return;
        setCarregando(false);
        setErro(
          falha instanceof Error ? falha.message : "Falha ao abrir o episódio.",
        );
      }
    }

    void anexar();

    return () => {
      cancelado = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [midia, modo]);

  /* ---- sincronismo com o elemento ---- */

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function aoTempo() {
      if (!video) return;
      setTempo(video.currentTime);

      if (video.currentTime - ultimoPing.current >= INTERVALO_PING) {
        ultimoPing.current = video.currentTime;
        const total = video.duration;
        enviarProgresso(
          video.currentTime,
          total > 0 && video.currentTime / total >= LIMIAR_CONCLUSAO,
        );
      }
    }

    function aoMetadado() {
      if (video && Number.isFinite(video.duration)) setDuracao(video.duration);
    }

    function aoTocar() {
      setTocando(true);
    }
    function aoPausar() {
      if (video) enviarProgresso(video.currentTime, false);
      setTocando(false);
    }
    function aoTerminar() {
      if (video) enviarProgresso(video.duration, true);
      setTocando(false);
    }

    video.addEventListener("timeupdate", aoTempo);
    video.addEventListener("loadedmetadata", aoMetadado);
    video.addEventListener("play", aoTocar);
    video.addEventListener("pause", aoPausar);
    video.addEventListener("ended", aoTerminar);

    return () => {
      video.removeEventListener("timeupdate", aoTempo);
      video.removeEventListener("loadedmetadata", aoMetadado);
      video.removeEventListener("play", aoTocar);
      video.removeEventListener("pause", aoPausar);
      video.removeEventListener("ended", aoTerminar);
    };
  }, [enviarProgresso]);

  /* ---- comandos ---- */

  const alternar = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => setTocando(false));
    else video.pause();
  }, []);

  const irPara = useCallback((segundos: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = segundos;
    setTempo(segundos);
  }, []);

  const pular = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const alvo = Math.min(
      Math.max(video.currentTime + delta, 0),
      video.duration || Number.MAX_SAFE_INTEGER,
    );
    video.currentTime = alvo;
    setTempo(alvo);
  }, []);

  const definirVelocidade = useCallback((valor: number) => {
    const video = videoRef.current;
    if (video) video.playbackRate = valor;
    setVelocidade(valor);
  }, []);

  const proximo = useCallback(() => {
    if (!episodio) return;
    const indice = fila.findIndex((e) => e.conteudoId === episodio.conteudoId);
    const seguinte = fila[indice + 1];
    if (seguinte) abrir(seguinte, fila);
  }, [abrir, episodio, fila]);

  const fechar = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      enviarProgresso(video.currentTime, false);
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
    hlsRef.current?.destroy();
    hlsRef.current = null;
    videoIdRef.current = null;
    setMidia(null);
    setEpisodio(null);
    setTocando(false);
    setTempo(0);
  }, [enviarProgresso]);

  /*
   * A troca entre áudio e vídeo passa por estes dois comandos, e não por um
   * `setModo` seco: o episódio precisa CONTINUAR de onde estava. Quem toca
   * muda; a posição, não.
   */
  const cederPara = useCallback(() => {
    const video = videoRef.current;
    if (!video) return posicaoRef.current;
    const posicao = video.currentTime;
    posicaoRef.current = posicao;
    video.pause();
    return posicao;
  }, []);

  /*
   * Devolve a reprodução ao canal de áudio.
   *
   * Ele próprio volta o modo para "audio" — e é isso que faz a fonte ser
   * anexada, pela etapa 2. Mandar tocar aqui não funcionaria: em modo vídeo o
   * elemento está sem fonte nenhuma, justamente para não concorrer com o
   * <Player>. As refs abaixo são o recado para quando ela chegar.
   */
  const retomarEm = useCallback((segundos: number, deveTocar: boolean) => {
    /*
     * Zero significa "o vídeo nunca andou", e não "volte para o começo" — o
     * ponto salvo do episódio já está na ref, vindo da etapa 1. Sobrescrevê-lo
     * jogaria fora a retomada de quem só espiou a tela.
     */
    if (segundos > 0) {
      posicaoRef.current = segundos;
      setTempo(segundos);
    }
    deveTocarRef.current = deveTocar;
    setModo("audio");
  }, []);

  const valor = useMemo<Reprodutor>(
    () => ({
      episodio,
      fila,
      tocando,
      carregando,
      erro,
      tempo,
      duracao,
      velocidade,
      modo,
      abrir,
      alternar,
      irPara,
      pular,
      definirVelocidade,
      definirModo: setModo,
      proximo,
      fechar,
      naPagina,
      registrarPagina: setNaPagina,
      midia,
      cederPara,
      retomarEm,
    }),
    [
      episodio,
      fila,
      tocando,
      carregando,
      erro,
      tempo,
      duracao,
      velocidade,
      modo,
      abrir,
      alternar,
      irPara,
      pular,
      definirVelocidade,
      proximo,
      fechar,
      naPagina,
      midia,
      cederPara,
      retomarEm,
    ],
  );

  return (
    <ContextoPodcast.Provider value={valor}>
      {children}

      {/*
        O elemento vive AQUI, irmão das páginas e nunca dentro delas — é o que
        permite sair da tela sem cortar o episódio.

        Ele é o canal de ÁUDIO, e por isso fica sempre fora de vista. O modo
        vídeo é servido pelo <Player> da plataforma, montado na página: ele já
        traz controles próprios, qualidade, legendas, PiP e a tela cheia com a
        barra da casa — que era justamente o que faltava aqui.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 h-px w-px overflow-hidden opacity-0"
      >
        <video ref={videoRef} playsInline className="h-full w-full" />
      </div>

    </ContextoPodcast.Provider>
  );
}
