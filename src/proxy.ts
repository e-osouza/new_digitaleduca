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

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

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
