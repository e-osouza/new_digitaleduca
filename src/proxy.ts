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
  "/meus-conteudos",
  "/minha-lista",
  "/verificar-email",
  "/instrutor",
  "/tag",
  "/categoria",
  "/planos",
  "/conta",
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

  const destino = new URL("/entrar", request.url);
  destino.searchParams.set("proximo", `${pathname}${search}`);
  return NextResponse.redirect(destino);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
