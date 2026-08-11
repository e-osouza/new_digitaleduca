import { NextResponse, type NextRequest } from "next/server";
import { NOME_COOKIE_SESSAO } from "@/lib/session";

/**
 * Encerra uma sessão que a API recusou (token expirado ou revogado).
 *
 * Sem isto o cookie inválido continuaria no navegador: o proxy o aceitaria,
 * a página logada tomaria 401 e mandaria de volta para o login, que por sua
 * vez veria o cookie e devolveria para a plataforma — um laço sem fim.
 */
export function GET(request: NextRequest) {
  const proximo = request.nextUrl.searchParams.get("proximo");

  const destino = new URL("/entrar", request.url);
  if (proximo?.startsWith("/")) destino.searchParams.set("proximo", proximo);
  destino.searchParams.set("expirada", "1");

  const resposta = NextResponse.redirect(destino);
  resposta.cookies.delete(NOME_COOKIE_SESSAO);
  return resposta;
}
