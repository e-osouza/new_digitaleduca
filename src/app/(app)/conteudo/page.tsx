import { redirect } from "next/navigation";

/**
 * A listagem unificada saiu daqui.
 *
 * Cada tipo passou a ter tela própria — `/cursos` e `/masterclass` —, e este
 * caminho ficou só para não quebrar o que já foi compartilhado. A ficha de
 * cada conteúdo (`/conteudo/{id}`) continua exatamente onde estava: um
 * segmento pode ter página própria E filhos dinâmicos.
 */
export default function PaginaConteudo() {
  redirect("/masterclass");
}
