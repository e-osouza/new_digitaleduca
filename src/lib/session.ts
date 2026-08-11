import "server-only";
import { cookies } from "next/headers";

export const NOME_COOKIE_SESSAO = "de_sessao";

/** 7 dias. A API não expõe o `exp` do JWT, então usamos uma janela própria. */
const DURACAO_SESSAO = 60 * 60 * 24 * 7;

export async function lerToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(NOME_COOKIE_SESSAO)?.value ?? null;
}

export async function gravarToken(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(NOME_COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_SESSAO,
  });
}

export async function apagarToken(): Promise<void> {
  const jar = await cookies();
  jar.delete(NOME_COOKIE_SESSAO);
}

export async function estaAutenticado(): Promise<boolean> {
  return (await lerToken()) !== null;
}
