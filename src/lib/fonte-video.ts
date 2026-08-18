import type { VimeoFonte } from "@/types/api";

/** Legenda já com a URL apontando para o nosso proxy autenticado. */
export type Legenda = {
  id: string;
  label: string;
  language: string;
  kind: string;
  src: string;
};

export type FonteVimeo = {
  /** Manifesto HLS, quando a API o oferece. */
  linkHls: string | null;
  /**
   * MP4 progressivos, do melhor para o pior. A API devolve cinco
   * renderizações; guardar todas permite descer de qualidade quando uma
   * falha, em vez de mostrar erro na primeira tentativa frustrada.
   */
  filaMp4: string[];
  legendas: Legenda[];
};

/** Altura em pixels declarada em `quality` ("1080p" → 1080). Serve para ordenar. */
function altura(qualidade: string | undefined) {
  const numero = Number.parseInt(qualidade ?? "", 10);
  return Number.isNaN(numero) ? 0 : numero;
}

/*
 * O formato vem do `type` declarado em `sources` — é o dado confiável. A
 * inferência pelo caminho só entra quando a API devolve apenas `url`, e aí
 * "não é mp4" é o teste certo: os dois formatos trazem a extensão antes da
 * query (`/hls.m3u8?s=…` e `/file.mp4?loc=…`), mas o progressivo repete `.mp4`
 * no meio do nome, então procurar `.m3u8` daria falso negativo em URLs de
 * streaming com sufixo diferente.
 */
const ehMp4 = (endereco: string) => /\.mp4(\?|#|$)/i.test(endereco);

/**
 * Pergunta ao nosso proxy quais fontes o Vimeo oferece para um vídeo e as
 * organiza para reprodução.
 *
 * Vive fora dos players porque são DOIS que precisam dela — o de aulas e o de
 * podcast — e o que ela resolve são justamente as pegadinhas do contrato da
 * API (o `type` como fonte da verdade, o `.mp4` repetido no meio da URL, a
 * fila de queda de qualidade). Duplicar isso seria duplicar as pegadinhas.
 *
 * Como ANEXAR a fonte ao elemento continua sendo problema de cada player: o de
 * aulas tem menu de qualidade e legendas, o de podcast trava no nível mais
 * baixo quando está em modo áudio.
 */
export async function resolverFonteVimeo(vimeoId: string): Promise<FonteVimeo> {
  const resposta = await fetch(`/api/video/${vimeoId}/link`);

  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => ({}))) as { erro?: string };
    throw new Error(corpo.erro ?? "Não foi possível carregar o vídeo.");
  }

  const {
    url,
    sources = [],
    legendas = [],
  } = (await resposta.json()) as {
    url?: string;
    sources?: VimeoFonte[];
    legendas?: Legenda[];
  };

  const linkHls =
    sources.find((fonte) => fonte.type === "hls")?.url ??
    (url && !ehMp4(url) ? url : null);

  const filaMp4 = sources
    .filter((fonte) => fonte.type === "mp4")
    .sort((a, b) => altura(b.quality) - altura(a.quality))
    .map((fonte) => fonte.url);

  if (url && ehMp4(url) && !filaMp4.includes(url)) filaMp4.push(url);

  return { linkHls, filaMp4, legendas };
}
