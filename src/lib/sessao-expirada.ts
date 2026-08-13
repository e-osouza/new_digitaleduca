import "server-only";
import { redirect } from "next/navigation";

/**
 * Chamar quando a API responder 401 durante a renderização de uma página
 * logada. Passa pelo route handler que apaga o cookie antes de devolver ao
 * login — em vez de redirecionar direto para a raiz, que manteria o cookie
 * inválido e criaria um laço de redirecionamentos.
 */
export function encerrarSessaoExpirada(proximo: string): never {
  redirect(`/api/auth/expirar?proximo=${encodeURIComponent(proximo)}`);
}
