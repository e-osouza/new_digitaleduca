import { notFound, redirect } from "next/navigation";
import { REDIRECIONAMENTOS } from "@/lib/nav";

/**
 * Só redireciona.
 *
 * Este segmento endereçava todas as listagens por tipo (`/tipo/aula`,
 * `/tipo/podcast`…). Cada uma ganhou caminho próprio, e o que sobrou aqui é a
 * ponte para os links já compartilhados e o que ficou salvo nos favoritos.
 * Quando o tráfego para cá secar, a pasta inteira pode sair.
 */
export default async function RedirecionaTipo({
  params,
}: {
  params: Promise<{ tipo: string }>;
}) {
  const { tipo } = await params;
  const destino = REDIRECIONAMENTOS[tipo.toLowerCase()];
  if (!destino) notFound();
  redirect(destino);
}
