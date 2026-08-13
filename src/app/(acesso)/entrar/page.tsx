import { redirect, permanentRedirect } from "next/navigation";

/**
 * `/entrar` virou apelido da raiz, que agora é a própria tela de login.
 *
 * A rota continua existindo porque muita coisa aponta para ela: bookmarks de
 * quem já usava a plataforma, o e-mail de recuperação e — enquanto o cache do
 * navegador não expirar — respostas antigas do `proxy.ts`. Preserva a query
 * (`proximo`, `expirada`) para não perder o destino nem o aviso de sessão.
 */
export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string; expirada?: string }>;
}) {
  const { proximo, expirada } = await searchParams;

  const busca = new URLSearchParams();
  if (proximo?.startsWith("/")) busca.set("proximo", proximo);
  if (expirada) busca.set("expirada", expirada);

  const destino = busca.size > 0 ? `/?${busca}` : "/";

  /*
   * Com `expirada` o redirect é temporário de propósito: o navegador não pode
   * memorizar um caminho que carrega um aviso pontual. Sem ela, 308 permanente
   * tira o salto das próximas visitas.
   */
  if (expirada) redirect(destino);
  permanentRedirect(destino);
}
