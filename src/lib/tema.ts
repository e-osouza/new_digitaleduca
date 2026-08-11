import "server-only";
import { cookies } from "next/headers";

export type Tema = "claro" | "escuro";

export const NOME_COOKIE_TEMA = "de_tema";
export const TEMA_PADRAO: Tema = "claro";

/** 1 ano — a preferência de tema não precisa expirar junto com a sessão. */
export const DURACAO_TEMA = 60 * 60 * 24 * 365;

export function ehTema(valor: unknown): valor is Tema {
  return valor === "claro" || valor === "escuro";
}

/**
 * Lido no servidor e aplicado como `data-tema` no <html>, para a página já
 * chegar pintada. Guardar em localStorage exigiria um script bloqueante para
 * evitar a piscada de tema errado na primeira renderização.
 */
export async function lerTema(): Promise<Tema> {
  const jar = await cookies();
  const valor = jar.get(NOME_COOKIE_TEMA)?.value;
  return ehTema(valor) ? valor : TEMA_PADRAO;
}
