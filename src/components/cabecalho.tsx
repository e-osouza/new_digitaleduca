import Link from "next/link";
import { Marca } from "@/components/marca";
import { SITE_INSTITUCIONAL } from "@/lib/nav";

/**
 * Cabeçalho das telas de acesso: login, cadastro e recuperação de senha.
 *
 * Ficou reduzido à marca depois que a página institucional saiu deste projeto.
 * O menu antigo apontava para âncoras da landing (`/#conteudos`, `/#planos`,
 * `/#contato`) que deixaram de existir aqui — manter aqueles links produziria
 * 404. A marca leva ao site institucional, que é o único caminho de volta que
 * ainda faz sentido a partir de `plataforma.digitaleduca.com.vc`.
 */
export function Cabecalho() {
  return (
    <header className="border-borda-suave bg-cromo/85 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 sm:px-8 lg:px-10">
        <a
          href={SITE_INSTITUCIONAL}
          className="shrink-0"
          aria-label="Digital Educa — site institucional"
        >
          <Marca altura={26} />
        </a>

        <Link
          href="/cadastro"
          className="text-texto-2 hover:text-texto ml-auto px-2 text-sm font-medium transition-colors"
        >
          Criar conta
        </Link>
      </div>
    </header>
  );
}
