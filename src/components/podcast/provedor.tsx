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
import loaderDaApi from "@/lib/image-loader";

/** Episódio como a playlist o conhece — sem nada que exija o `findOne`. */
export type Episodio = {
  conteudoId: number;
  convidado: string;
  tema: string | null;
  capa: string | null;
  /** Segundos, vindos da listagem. */
  duracao: number;
  publicadoEm: string | null;
  descricao: string | null;
  /** Quem apresenta — `papel: "APRESENTADOR"` no vínculo da API. */
  apresentadores: string[];
  /**
   * Quem foi conversar, de `conteudos.convidados`. Não confundir com
   * `convidado` acima, que é a primeira parte do TÍTULO — quase sempre o mesmo
   * nome, mas vindo de outro lugar e usado como chamada do card.
   */
  convidados: string[];
  categoria: string | null;
  /** 0 a 100, já ouvido. */
  percentual: number;
  concluido: boolean;
};

export type ModoPodcast = "audio" | "video";

/** O que `/api/podcast/{id}` devolve: onde está a mídia e onde parou. */
type Identificacao = {
  videoId: number;
  vimeoId: string;
  segundos: number;
  duracao: number;
};

type Reprodutor = {
  episodio: Episodio | null;
  fila: Episodio[];
  tocando: boolean;
  carregando: boolean;
  erro: string | null;
  /**
   * O erro é falta de assinatura, e não falha técnica. Separado porque o
   * desfecho é outro: aqui há um caminho (assinar), e não só um aviso.
   */
  bloqueado: boolean;
  /** Segundos decorridos e totais, já do elemento — não da listagem. */
  tempo: number;
  duracao: number;
  velocidade: number;
  modo: ModoPodcast;
  /**
   * `doComeco` ignora a posição salva e recomeça do zero. É o que o botão
   * "Ouvir de novo" usa: num episódio terminado a posição gravada está no
   * fim, e retomar dali daria um play que acaba no mesmo segundo.
   */
  abrir: (
    episodio: Episodio,
    fila: Episodio[],
    opcoes?: { doComeco?: boolean },
  ) => void;
  /**
   * Adianta as duas idas à rede que separam o clique do som.
   *
   * Medido: identificar o episódio custa ~0,3s e assinar a URL no Vimeo custa
   * de 0,8s a 2s — tudo DEPOIS do clique, em série. Chamando isto quando o
   * episódio entra em foco, esse tempo corre enquanto a pessoa ainda lê a
   * ficha, e o play encontra o trabalho pronto.
   *
   * Silencioso de propósito: falha aqui não vira erro na tela, só desiste do
   * adiantamento. Quem reporta é a abertura de verdade.
   */
  preparar: (episodio: Episodio) => void;
  alternar: () => void;
  irPara: (segundos: number) => void;
  pular: (delta: number) => void;
  definirVelocidade: (valor: number) => void;
  definirModo: (valor: ModoPodcast) => void;
  proximo: () => void;
  fechar: () => void;
  /**
   * Episódios terminados NESTA sessão. O que a página recebeu do servidor é de
   * quando ela carregou — sem isto, ouvir um episódio até o fim só acenderia o
   * visto na playlist depois de um recarregamento.
   */
  concluidos: ReadonlySet<number>;
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
/**
 * Fração a partir da qual o episódio conta como concluído. É exportada porque
 * a playlist precisa acender o visto no MESMO ponto em que o progresso é
 * enviado à API — dois limiares diferentes fariam a marca discordar do banco.
 */
export const LIMIAR_CONCLUSAO = 0.95;

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
  const [bloqueado, setBloqueado] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [velocidade, setVelocidade] = useState(1);
  const [modo, setModo] = useState<ModoPodcast>("audio");
  const [concluidos, setConcluidos] = useState<ReadonlySet<number>>(new Set());

  /*
   * Id do episódio no ar, em ref: os ouvintes de mídia abaixo precisam dele,
   * e tê-lo como dependência os faria reassinar a cada troca de faixa.
   */
  const episodioIdRef = useRef<number | null>(null);

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
  /*
   * Episódios já adiantados, por conteúdo. Guardar a PROMESSA, e não o
   * resultado, evita disparar duas buscas quando o preparo e o clique se
   * cruzam — o segundo pega a mesma promessa em andamento.
   */
  const preparados = useRef(new Map<number, Promise<Identificacao>>());
  /* Ligado por `abrir(..., { doComeco: true })`; some assim que a mídia carrega. */
  const doComecoRef = useRef(false);
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

  /* Mesmo motivo: `retomarEm` precisa do modo atual e não pode depender dele. */
  const modoRef = useRef(modo);
  useEffect(() => {
    modoRef.current = modo;
  }, [modo]);

  useEffect(() => {
    episodioIdRef.current = episodio?.conteudoId ?? null;
  }, [episodio]);

  const abrir = useCallback(
    (
      alvo: Episodio,
      novaFila: Episodio[],
      opcoes?: { doComeco?: boolean },
    ) => {
      setFila(novaFila);
      setErro(null);
      setBloqueado(false);
      deveTocarRef.current = true;
      doComecoRef.current = Boolean(opcoes?.doComeco);

      // Reabrir o episódio que já está no ar é só um play.
      if (episodio?.conteudoId === alvo.conteudoId) {
        /*
         * ...mas SÓ em modo áudio. Em vídeo quem reproduz é o <Player> da
         * página; dar play aqui poria os dois no ar ao mesmo tempo.
         */
        if (modo === "audio") {
          if (opcoes?.doComeco && videoRef.current) {
            videoRef.current.currentTime = 0;
            posicaoRef.current = 0;
            setTempo(0);
          }
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
   * Busca a identificação UMA vez por episódio e adianta a assinatura da URL.
   *
   * A promessa fica no mapa para o clique reaproveitar o que o preparo já
   * começou. É consumida de uma vez só (`delete` ao usar): a posição salva
   * muda a cada escuta, e reaproveitá-la depois faria o episódio retomar num
   * ponto velho.
   */
  const identificarEpisodio = useCallback(
    (conteudoId: number): Promise<Identificacao> => {
      const emAndamento = preparados.current.get(conteudoId);
      if (emAndamento) return emAndamento;

      const promessa = (async () => {
        const resposta = await fetch(`/api/podcast/${conteudoId}`);
        if (!resposta.ok) {
          const corpo = (await resposta.json().catch(() => ({}))) as {
            erro?: string;
          };
          const falha: Error & { status?: number } = new Error(
            corpo.erro ?? "Não foi possível abrir o episódio.",
          );
          falha.status = resposta.status;
          throw falha;
        }

        const dados = (await resposta.json()) as Identificacao;

        /*
         * Já dispara a assinatura da URL, que é a parte cara (0,8s a 2s). O
         * resultado é descartado: quem o consome é a etapa 2, e a essa altura
         * a resposta já está no cache HTTP do navegador.
         */
        void fetch(`/api/video/${dados.vimeoId}/link`).catch(() => {});

        return dados;
      })();

      /* Falha não fica grudada no mapa: a próxima tentativa recomeça limpa. */
      promessa.catch(() => preparados.current.delete(conteudoId));
      preparados.current.set(conteudoId, promessa);
      return promessa;
    },
    [],
  );

  const preparar = useCallback(
    (alvo: Episodio) => {
      // Silencioso: preparo que falha não vira erro na tela.
      void identificarEpisodio(alvo.conteudoId).catch(() => {});
    },
    [identificarEpisodio],
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

      const conteudoId = episodio.conteudoId;

      try {
        // Reaproveita o que `preparar` já buscou, se houver.
        const dados = await identificarEpisodio(conteudoId);
        // Consumida: a posição salva envelhece a cada escuta.
        preparados.current.delete(conteudoId);
        if (cancelado) return;

        /* Pediram do começo: a posição gravada não vale para esta abertura. */
        const retomada = doComecoRef.current ? 0 : dados.segundos;
        doComecoRef.current = false;

        videoIdRef.current = dados.videoId;
        ultimoPing.current = retomada;
        posicaoRef.current = retomada;
        setMidia({
          videoId: dados.videoId,
          vimeoId: dados.vimeoId,
          segundos: retomada,
        });
      } catch (falha) {
        if (cancelado) return;
        preparados.current.delete(conteudoId);
        if ((falha as Error & { status?: number })?.status === 403) {
          setBloqueado(true);
        }
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
    /*
     * `identificarEpisodio` é estável (useCallback sem dependências) e entra
     * aqui só para o lint parar de apontar. O que realmente dispara este
     * efeito é a troca de episódio — incluí-la muda nada, mas deixa a lista
     * honesta.
     */
  }, [episodio, identificarEpisodio]);

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
            const hls = new Hls({
              enableWorker: true,
              /*
               * Começa pelo nível mais leve e sobe depois.
               *
               * Sem isto o hls.js sonda a banda antes de escolher, e o
               * primeiro segmento vem na qualidade mais alta que ele arriscar
               * — som que ninguém distingue num podcast, pago com segundos de
               * espera. A régua de qualidade (ABR) continua ligada: ela sobe
               * sozinha depois que o áudio já começou.
               */
              startLevel: 0,
              /*
               * Estimativa inicial de banda deliberadamente conservadora, pelo
               * mesmo motivo: entre errar para cima (buffer vazio, espera) e
               * errar para baixo (um trecho em qualidade menor), o segundo é
               * invisível num episódio falado.
               */
              abrEwmaDefaultEstimate: 500_000,
            });
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

      const total = video.duration;
      const terminou = total > 0 && video.currentTime / total >= LIMIAR_CONCLUSAO;

      if (terminou) marcarConcluido();

      if (video.currentTime - ultimoPing.current >= INTERVALO_PING) {
        ultimoPing.current = video.currentTime;
        enviarProgresso(video.currentTime, terminou);
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
      marcarConcluido();
      setTocando(false);
    }

    /*
     * Acende o visto no MESMO limiar em que a conclusão é enviada à API — dois
     * pontos diferentes fariam a marca da playlist discordar do banco. Vem de
     * um ouvinte de evento, e não de um efeito, porque é reação a algo que
     * aconteceu fora do React.
     */
    function marcarConcluido() {
      const id = episodioIdRef.current;
      if (id === null) return;
      setConcluidos((antes) => (antes.has(id) ? antes : new Set(antes).add(id)));
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

  /* ---- ficha na tela de bloqueio e nos fones ---- */

  /*
   * Media Session: é ela que preenche a notificação do Android, o Centro de
   * Controle do iOS e a barrinha de mídia do Chrome no desktop.
   *
   * Sem isto o sistema mostra o que consegue adivinhar sozinho — o nome da
   * aba e o ícone do site —, que é por que aparecia "Podcasts · Digital Educa"
   * com o domínio embaixo e o logotipo no lugar da capa.
   *
   * A arte pede URLs ABSOLUTAS: quem desenha a notificação é o sistema
   * operacional, fora da página, e um caminho relativo não significa nada
   * para ele. Por isso passamos pelo mesmo loader do next/image, que devolve
   * o endereço completo no proxy da API. Vários tamanhos porque cada
   * superfície escolhe o seu — a tela de bloqueio quer 512, a notificação
   * compacta se contenta com 96.
   */
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    if (!episodio) {
      navigator.mediaSession.metadata = null;
      return;
    }

    const pessoas = [...episodio.convidados, ...episodio.apresentadores];

    navigator.mediaSession.metadata = new MediaMetadata({
      // O tema é o título do episódio; sem tema, o próprio nome do convidado.
      title: episodio.tema ?? episodio.convidado,
      // Quem está na conversa — é a linha que o sistema mostra como "artista".
      artist: pessoas.length > 0 ? pessoas.join(", ") : episodio.convidado,
      album: "Podcasts · Digital Educa",
      artwork: episodio.capa
        ? [96, 128, 192, 256, 384, 512].map((px) => ({
            src: loaderDaApi({ src: episodio.capa as string, width: px, quality: 80 }),
            sizes: `${px}x${px}`,
            type: "image/webp",
          }))
        : [],
    });
  }, [episodio]);

  /*
   * Os botões da notificação. Sem `setActionHandler` o sistema oferece só
   * play/pause; com eles aparecem avançar 15s, voltar 15s, próximo episódio e
   * — onde houver — o arrastar da barra.
   */
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;

    const acoes: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => videoRef.current?.play().catch(() => setTocando(false))],
      ["pause", () => videoRef.current?.pause()],
      ["nexttrack", () => proximo()],
      ["seekbackward", (d) => pular(-(d.seekOffset ?? 15))],
      ["seekforward", (d) => pular(d.seekOffset ?? 15)],
      ["seekto", (d) => { if (typeof d.seekTime === "number") irPara(d.seekTime); }],
    ];

    for (const [acao, mao] of acoes) {
      // Nem todo navegador conhece todas as ações; a desconhecida lança.
      try {
        ms.setActionHandler(acao, mao);
      } catch {
        /* ação não suportada aqui */
      }
    }

    return () => {
      for (const [acao] of acoes) {
        try {
          ms.setActionHandler(acao, null);
        } catch {
          /* idem */
        }
      }
    };
  }, [proximo, pular, irPara]);

  /*
   * Posição e velocidade.
   *
   * O navegador estima sozinho a régua da notificação a partir do elemento,
   * mas a estimativa assume 1×. Como o player oferece até 2×, sem informar a
   * taxa a barra do sistema anda mais devagar que o áudio e vai descolando.
   *
   * Não é chamado a cada `timeupdate` — quatro vezes por segundo seria ruído.
   * Só quando muda algo que a estimativa não consegue acompanhar: a duração,
   * a velocidade, ou um salto na posição.
   */
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!navigator.mediaSession.setPositionState) return;
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: video.duration,
        playbackRate: video.playbackRate,
        position: Math.min(video.currentTime, video.duration),
      });
    } catch {
      /* posição inválida durante uma troca de faixa — o próximo passe corrige */
    }
  }, [duracao, velocidade, episodio, tocando]);

  /* O ícone de play/pause do sistema precisa concordar com o nosso estado. */
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = !episodio
      ? "none"
      : tocando
        ? "playing"
        : "paused";
  }, [episodio, tocando]);

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
     * Já em áudio não há reprodução a devolver — quem chamou está saindo de
     * uma tela que nunca teve o comando.
     *
     * Sem esta saída, a limpeza de desmontagem da página apagava um
     * `deveTocar` recém-escrito por `abrir`, e o episódio aberto por um card
     * chegava carregado mas PARADO. Em desenvolvimento isso era certeiro: o
     * React monta, desmonta e monta de novo, então a limpeza rodava sempre
     * entre o pedido e a anexação da fonte.
     */
    if (modoRef.current === "audio") return;

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
      bloqueado,
      tempo,
      duracao,
      velocidade,
      modo,
      abrir,
      preparar,
      alternar,
      irPara,
      pular,
      definirVelocidade,
      definirModo: setModo,
      proximo,
      fechar,
      naPagina,
      concluidos,
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
      bloqueado,
      tempo,
      duracao,
      velocidade,
      modo,
      abrir,
      alternar,
      preparar,
      irPara,
      pular,
      definirVelocidade,
      proximo,
      fechar,
      naPagina,
      concluidos,
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
