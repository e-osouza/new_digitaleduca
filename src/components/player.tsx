"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VimeoFonte } from "@/types/api";

type Estado = "carregando" | "pronto" | "erro";

/** A cada quantos segundos de reprodução o progresso é enviado à API. */
const INTERVALO_PING = 15;
/** Fração do vídeo a partir da qual ele conta como concluído. */
const LIMIAR_CONCLUSAO = 0.95;

export function Player({
  vimeoId,
  videoId,
  segundosIniciais = 0,
  titulo,
}: {
  vimeoId: string;
  /** ID do vídeo no banco — é ele que o endpoint de progresso espera. */
  videoId: number | null;
  segundosIniciais?: number;
  titulo: string;
}) {
  const referencia = useRef<HTMLVideoElement>(null);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [mensagemErro, setMensagemErro] = useState("");

  const ultimoEnvio = useRef(0);
  const concluidoEnviado = useRef(false);

  const enviarProgresso = useCallback(
    (segundos: number, concluido: boolean) => {
      if (videoId === null) return;
      // keepalive garante o envio mesmo se a aba for fechada em seguida.
      void fetch("/api/progresso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, seconds: Math.floor(segundos), concluido }),
        keepalive: true,
      }).catch(() => {
        // Progresso é acessório: uma falha aqui não interrompe a reprodução.
      });
    },
    [videoId],
  );

  /* ---- carrega a fonte HLS ---- */
  useEffect(() => {
    const video = referencia.current;
    if (!video) return;

    let cancelado = false;
    let destruirHls: (() => void) | undefined;

    async function carregar() {
      try {
        const resposta = await fetch(`/api/video/${vimeoId}/link`);
        if (!resposta.ok) {
          const corpo = (await resposta.json().catch(() => ({}))) as {
            erro?: string;
          };
          throw new Error(corpo.erro ?? "Não foi possível carregar o vídeo.");
        }

        const { url, sources = [] } = (await resposta.json()) as {
          url?: string;
          sources?: VimeoFonte[];
        };
        if (cancelado || !video) return;

        /*
         * O formato vem do `type` declarado em `sources`. Quando a API devolve
         * só `url`, inferimos pelo caminho: os links progressivos do Vimeo
         * terminam em `.mp4`, enquanto os de streaming (`play.hls.link`) NÃO
         * terminam em `.m3u8` — por isso "não é mp4" é o teste certo aqui, e
         * não "contém .m3u8", que deixava o manifesto ir direto para o <video>.
         */
        const ehMp4 = (endereco: string) => /\.mp4(\?|#|$)/i.test(endereco);

        const linkHls =
          sources.find((fonte) => fonte.type === "hls")?.url ??
          (url && !ehMp4(url) ? url : null);

        const linkMp4 =
          sources.find((fonte) => fonte.type === "mp4")?.url ??
          (url && ehMp4(url) ? url : undefined);

        const suporteNativo =
          video.canPlayType("application/vnd.apple.mpegurl") !== "";

        if (linkHls && suporteNativo) {
          // Safari reproduz HLS sem biblioteca.
          video.src = linkHls;
        } else if (linkHls) {
          const { default: Hls } = await import("hls.js");
          if (cancelado) return;

          if (Hls.isSupported()) {
            const hls = new Hls({ enableWorker: true });
            hls.loadSource(linkHls);
            hls.attachMedia(video);
            hls.on(Hls.Events.ERROR, (_evento, dados) => {
              if (dados.fatal) {
                setEstado("erro");
                setMensagemErro(
                  "A transmissão falhou. Recarregue a página ou tente outra aula.",
                );
              }
            });
            destruirHls = () => hls.destroy();
          } else if (linkMp4) {
            video.src = linkMp4;
          } else {
            throw new Error("Seu navegador não suporta a reprodução deste vídeo.");
          }
        } else if (linkMp4) {
          video.src = linkMp4;
        } else {
          throw new Error("Nenhuma fonte de vídeo disponível.");
        }

        if (!cancelado) setEstado("pronto");
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
      destruirHls?.();
    };
  }, [vimeoId]);

  /* ---- falhas do próprio elemento de mídia ---- */
  useEffect(() => {
    const video = referencia.current;
    if (!video) return;

    /*
     * Sem este ouvinte, uma fonte que o navegador não consegue decodificar
     * deixa o player preto em 0:00, sem nenhum aviso — foi o que acontecia
     * quando um manifesto HLS ia direto para o <video> no Chrome.
     */
    function aoFalhar() {
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
  }, []);

  /* ---- retoma de onde parou ---- */
  useEffect(() => {
    const video = referencia.current;
    if (!video || estado !== "pronto" || segundosIniciais <= 0) return;

    function retomar() {
      if (video && video.currentTime < 1) video.currentTime = segundosIniciais;
    }

    video.addEventListener("loadedmetadata", retomar, { once: true });
    if (video.readyState >= 1) retomar();

    return () => video.removeEventListener("loadedmetadata", retomar);
  }, [estado, segundosIniciais]);

  /* ---- reporta progresso ---- */
  useEffect(() => {
    const video = referencia.current;
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
  }, [enviarProgresso, videoId]);

  return (
    <div className="bg-fundo-2 border-borda-suave relative aspect-video w-full overflow-hidden border-y sm:rounded-xl sm:border">
      <video
        ref={referencia}
        controls
        playsInline
        preload="metadata"
        aria-label={titulo}
        className="h-full w-full bg-black"
      />

      <div
        aria-hidden={estado !== "carregando"}
        className={`bg-fundo-2/90 absolute inset-0 flex items-center justify-center gap-3 transition-opacity duration-500 ${
          estado === "carregando" ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <span
          aria-hidden="true"
          className="border-borda border-t-acento h-5 w-5 animate-spin rounded-full border-2"
        />
        <span className="text-texto-3 text-sm">Carregando vídeo…</span>
      </div>

      {estado === "erro" && (
        <div className="bg-fundo-2 animate-surgir absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-texto font-semibold">Não foi possível reproduzir</p>
          <p className="text-texto-3 max-w-sm text-sm">{mensagemErro}</p>
        </div>
      )}
    </div>
  );
}
