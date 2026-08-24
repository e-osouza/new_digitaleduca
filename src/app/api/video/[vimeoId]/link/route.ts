import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api";
import { linkDoVideo } from "@/lib/queries";

/**
 * Entrega ao player o link HLS do Vimeo. A API exige JWT e valida o acesso ao
 * conteúdo, então o browser nunca vê o token — só a URL de reprodução.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vimeoId: string }> },
) {
  const { vimeoId } = await params;

  if (!/^\d+$/.test(vimeoId)) {
    return NextResponse.json({ erro: "ID de vídeo inválido." }, { status: 400 });
  }

  try {
    const { url, sources, textTracks } = await linkDoVideo(vimeoId);
    /*
     * `sources` carrega o tipo declarado de cada fonte; o player depende dele.
     * As legendas vão com a URL já reescrita para o nosso proxy — o <track> do
     * navegador não envia o cabeçalho de autenticação que a API exige.
     */
    return NextResponse.json(
      {
      url,
      sources: sources ?? [],
      legendas: (textTracks ?? []).map((faixa) => ({
        id: faixa.id,
        label: faixa.label,
        language: faixa.language,
        kind: faixa.kind,
        src: `/api/video/${vimeoId}/legenda/${faixa.id}`,
      })),
      },
      {
        /*
         * `private`: o cache é do navegador de quem pediu, nunca de um
         * intermediário. A URL assinada é uma chave de acesso à mídia, e
         * guardá-la num cache compartilhado a entregaria a quem não passou
         * pela checagem acima.
         *
         * Os 10 minutos existem para o clique reaproveitar o que o preparo do
         * player já buscou: sem cache, a mesma URL era assinada duas vezes e
         * o play pagava ~1s de novo. A assinatura do Vimeo vale ~24h, então a
         * janela é folgada — curta o bastante para uma perda de acesso no meio
         * do caminho não render muito mais que isso.
         */
        headers: { "Cache-Control": "private, max-age=600" },
      },
    );
  } catch (erro) {
    if (!(erro instanceof ApiError)) throw erro;

    if (erro.naoAutenticado) {
      return NextResponse.json({ erro: "Faça login para assistir." }, { status: 401 });
    }

    if (erro.semAssinatura) {
      return NextResponse.json(
        { erro: "Este conteúdo exige uma assinatura ativa." },
        { status: 403 },
      );
    }

    /*
     * A API procura o vídeo pela `url` na tabela `videos` e devolve 404 quando
     * não acha. Antes qualquer erro daqui virava "exige assinatura", o que
     * escondia justamente esse caso e mandava assinantes para o paywall.
     */
    if (erro.naoEncontrado) {
      return NextResponse.json(
        { erro: "Vídeo não encontrado no servidor de mídia." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { erro: "Não foi possível carregar o vídeo agora. Tente de novo." },
      { status: 502 },
    );
  }
}
