import Link from "next/link";

/**
 * Faixa horizontal de cards. O scroll é nativo (classe `.trilho` em
 * globals.css), sem JavaScript: funciona com toque, trackpad e teclado.
 *
 * Cabeçalho e faixa usam a mesma `.calha`, então o primeiro card nasce
 * exatamente na coluna do título em qualquer largura de tela — sem container
 * centralizado, que cortaria a rolagem antes da borda.
 */
export function Trilho({
  titulo,
  descricao,
  verMais,
  children,
}: {
  titulo: string;
  descricao?: string;
  verMais?: { href: string; rotulo: string };
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 sm:gap-4">
      <div className="calha flex w-full items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-0.5 sm:gap-1">
          <h2 className="font-display truncate text-lg font-semibold tracking-tight sm:text-xl lg:text-2xl">
            {titulo}
          </h2>
          {descricao && (
            <p className="text-texto-3 truncate text-xs sm:text-sm">{descricao}</p>
          )}
        </div>
        {verMais && (
          <Link
            href={verMais.href}
            className="text-acento hover:text-acento-claro shrink-0 text-xs font-semibold whitespace-nowrap transition-colors sm:text-sm"
          >
            {verMais.rotulo} →
          </Link>
        )}
      </div>

      <div className="trilho calha flex gap-3 overflow-x-auto pb-2 sm:gap-4">
        {children}
      </div>
    </section>
  );
}
