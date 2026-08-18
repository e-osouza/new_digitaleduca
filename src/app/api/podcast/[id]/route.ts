import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api";
import { obterConteudo } from "@/lib/queries";

/**
 * Dados de reprodução de um episódio, buscados no momento do play.
 *
 * `GET /conteudos` (a listagem que monta a playlist) traz os vídeos só com
 * id/título/duração — o caminho do Vimeo é preenchido apenas no `findOne`. Por
 * isso a página não pode resolver as fontes de antemão: seriam 18 chamadas
 * para o acervo inteiro, para tocar um episódio. Aqui é UMA, no clique.
 *
 * Devolve também o `videoId` do banco (o endpoint de progresso espera esse, e
 * não o do Vimeo) e o ponto onde a pessoa parou.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ erro: "ID inválido." }, { status: 400 });
  }

  try {
    // `obterConteudo` lança em qualquer falha — o catch abaixo é a guarda.
    const conteudo = await obterConteudo(Number(id));

    // Podcast do acervo é um vídeo único; se um dia vier em partes, a primeira
    // continua sendo a que abre.
    const video = conteudo.videos?.[0];
    // `url` chega como `/videos/1136993091` — ao player interessa só o número.
    const vimeoId = video?.url?.match(/(\d+)/)?.[1] ?? null;

    if (!video || !vimeoId) {
      return NextResponse.json(
        { erro: "Este episódio ainda não tem áudio publicado." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      videoId: video.id,
      vimeoId,
      segundos: video.ProgressoVideo?.[0]?.segundos ?? 0,
      duracao: video.duracao ?? conteudo.duracao ?? 0,
    });
  } catch (erro) {
    if (!(erro instanceof ApiError)) throw erro;

    if (erro.naoAutenticado) {
      return NextResponse.json({ erro: "Faça login para ouvir." }, { status: 401 });
    }

    if (erro.semAssinatura) {
      return NextResponse.json(
        { erro: "Este episódio exige uma assinatura ativa." },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { erro: "Não foi possível carregar o episódio agora." },
      { status: 502 },
    );
  }
}
