import Link from "next/link";

const ESTILO =
  "border-borda bg-superficie text-texto-2 hover:border-acento/60 hover:bg-superficie-2 hover:text-texto flex min-h-11 items-center rounded-full border px-5 text-sm font-semibold transition-colors";

/**
 * Paginação das listagens. Preserva os filtros da URL — trocar de página não
 * pode descartar a busca nem o tipo selecionado.
 */
export function Paginacao({
  base,
  pagina,
  totalPaginas,
  parametros = {},
}: {
  base: string;
  pagina: number;
  totalPaginas: number;
  /** Filtros a manter na URL, como `q` e `tipo`. */
  parametros?: Record<string, string | undefined>;
}) {
  if (totalPaginas <= 1) return null;

  function href(destino: number) {
    const busca = new URLSearchParams();
    for (const [chave, valor] of Object.entries(parametros)) {
      if (valor) busca.set(chave, valor);
    }
    busca.set("pagina", String(destino));
    return `${base}?${busca.toString()}`;
  }

  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-between gap-4 pt-2"
    >
      {pagina > 1 ? (
        <Link href={href(pagina - 1)} className={ESTILO} rel="prev">
          ← Anterior
        </Link>
      ) : (
        <span />
      )}

      <span className="text-texto-3 text-sm tabular-nums">
        {pagina} de {totalPaginas}
      </span>

      {pagina < totalPaginas ? (
        <Link href={href(pagina + 1)} className={ESTILO} rel="next">
          Próxima →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
