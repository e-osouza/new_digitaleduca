import Link from "next/link";
import { Marca } from "@/components/marca";

/**
 * Cabeçalho do site público. As páginas deste grupo redirecionam quem já está
 * autenticado para /inicio, então aqui só existe o estado de visitante.
 */
export function Cabecalho() {
  return (
    <header className="border-borda-suave bg-cromo/85 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 sm:px-8 lg:px-10">
        <Link href="/" className="shrink-0" aria-label="Início — Digital Educa">
          <Marca altura={26} />
        </Link>

        <nav className="text-texto-2 ml-6 hidden items-center gap-7 text-sm md:flex">
          <Link href="/#conteudos" className="hover:text-texto transition-colors">
            Conteúdos
          </Link>
          <Link href="/#planos" className="hover:text-texto transition-colors">
            Planos
          </Link>
          <Link href="/#contato" className="hover:text-texto transition-colors">
            Contato
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/entrar"
            className="text-texto-2 hover:text-texto hidden px-2 text-sm font-medium transition-colors sm:block"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="bg-acento text-fundo hover:bg-acento-hover rounded-full px-4 py-2 text-sm font-semibold transition-colors"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </header>
  );
}
