import { NextResponse, type NextRequest } from "next/server";
import { NOME_COOKIE_SESSAO } from "@/lib/session";

/**
 * Rotas da plataforma logada. O catálogo, o detalhe do conteúdo e o player
 * dependem de endpoints autenticados na API — sem cookie, nem renderizam.
 */
const ROTAS_PROTEGIDAS = [
  "/inicio",
  "/conteudo",
  "/assistir",
  "/buscar",
  "/tipo",
  "/trilhas",
  "/listas",
  "/meus-conteudos",
  "/salvos",
  "/verificar-email",
  "/instrutor",
  "/tag",
  "/categoria",
  "/planos",
  "/conta",
  "/club",
  "/perfil",
  "/estatisticas",
  /*
   * As listagens por tipo e o app entraram depois e ficaram de fora desta
   * lista. Sem cookie elas não quebravam — o layout da plataforma pede
   * `/usuario/me` e o 401 acaba mandando para o login —, mas o desvio passava
   * por uma renderização inteira e não preservava o destino em `?proximo`.
   */
  "/cursos",
  "/masterclass",
  "/podcast",
  "/aplicativo",
  "/notificacoes",
];

/** `/conteudo/163` — o formato que a API manda nas notificações. */
const FICHA_DE_CONTEUDO = /^\/conteudo\/(\d+)$/;

/*
 * Ids dos episódios, em memória, renovados a cada 5 minutos.
 *
 * O proxy roda antes de qualquer renderização e não tem o cache de dados do
 * Next à disposição, então a lista é guardada aqui mesmo. São ~20 números; o
 * custo é uma chamada pública a cada cinco minutos, e o ganho é um 307 de
 * verdade no lugar do `<meta refresh>` de 1 segundo que um `redirect()` de
 * página produz depois que o layout começou a transmitir.
 */
const VALIDADE_DO_ACERVO = 5 * 60 * 1000;
let episodios: { ids: Set<number>; ate: number } | null = null;

async function ehEpisodio(id: number) {
  if (!episodios || Date.now() > episodios.ate) {
    const base =
      process.env.NEXT_PUBLIC_API_URL ?? "https://api.digitaleduca.com.vc";

    try {
      const resposta = await fetch(`${base}/conteudos?tipo=PODCAST&limit=200`, {
        cache: "no-store",
      });
      if (!resposta.ok) return false;

      const corpo = (await resposta.json()) as { data?: { id: number }[] };
      episodios = {
        ids: new Set((corpo.data ?? []).map((c) => c.id)),
        ate: Date.now() + VALIDADE_DO_ACERVO,
      };
    } catch {
      // Sem acervo, ninguém é desviado — a ficha do conteúdo abre como sempre.
      return false;
    }
  }

  return episodios.ids.has(id);
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  /*
   * Notificação de podcast abre o player, e não a ficha.
   *
   * O aviso do sistema é entregue pelo service worker com o link cru que a API
   * mandou (`/conteudo/163`), e ali não há como saber o tipo do conteúdo. O
   * desvio acontece aqui, antes de qualquer renderização: quem clica cai
   * direto no episódio, que começa a tocar sozinho.
   *
   * Vem antes da checagem de sessão de propósito — assim quem estiver
   * deslogado volta para o PLAYER depois de entrar, e não para a ficha.
   */
  const ficha = pathname.match(FICHA_DE_CONTEUDO);
  if (ficha && (await ehEpisodio(Number(ficha[1])))) {
    return NextResponse.redirect(
      new URL(`/podcast?episodio=${ficha[1]}`, request.url),
    );
  }

  const protegida = ROTAS_PROTEGIDAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  );
  if (!protegida) return NextResponse.next();

  // A presença do cookie é só o primeiro filtro: a API continua sendo a
  // autoridade sobre a validade do token.
  if (request.cookies.has(NOME_COOKIE_SESSAO)) return NextResponse.next();

  // A raiz é a tela de login; `/entrar` existe só como apelido.
  const destino = new URL("/", request.url);
  destino.searchParams.set("proximo", `${pathname}${search}`);
  return NextResponse.redirect(destino);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
