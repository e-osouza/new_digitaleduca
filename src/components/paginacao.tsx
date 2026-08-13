import Link from "next/link";

/**
 * Páginas visíveis: sempre a primeira, a última e as vizinhas da atual, com
 * reticências nos saltos. O resultado tem no máximo 7 posições, o que cabe no
 * celular sem quebrar linha.
 */
export function paginasVisiveis(
  atual: number,
  total: number,
  vizinhos = 1,
): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const inicio = Math.max(2, atual - vizinhos);
  const fim = Math.min(total - 1, atual + vizinhos);

  const paginas: (number | "…")[] = [1];

  // Um salto de uma página só vira o próprio número, não reticências.
  if (inicio > 2) paginas.push(inicio === 3 ? 2 : "…");
  for (let p = inicio; p <= fim; p++) paginas.push(p);
  if (fim < total - 1) paginas.push(fim === total - 2 ? total - 1 : "…");

  paginas.push(total);
  return paginas;
}

const SETA =
  "border-borda bg-superficie text-texto-2 hover:border-acento/60 hover:bg-superficie-2 hover:text-texto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors";

export function Paginacao({
  base,
  pagina,
  totalPaginas,
  parametros = {},
}: {
  base: string;
  pagina: number;
  totalPaginas: number;
  /** Filtros a manter na URL, como `q`, `tipo` e `categoriaId`. */
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

  const paginas = paginasVisiveis(pagina, totalPaginas);

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-center gap-2 pt-2"
    >
      {pagina > 1 ? (
        <Link href={href(pagina - 1)} rel="prev" aria-label="Página anterior" className={SETA}>
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4.5 6.5 10l5.5 5.5" />
          </svg>
        </Link>
      ) : (
        <span className={`${SETA} pointer-events-none opacity-40`} aria-hidden="true">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4.5 6.5 10l5.5 5.5" />
          </svg>
        </span>
      )}

      <ol className="flex items-center gap-1.5">
        {paginas.map((item, indice) =>
          item === "…" ? (
            <li
              key={`salto-${indice}`}
              aria-hidden="true"
              className="text-texto-3 flex h-10 w-6 items-end justify-center pb-2 text-sm"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={href(item)}
                aria-label={`Página ${item}`}
                aria-current={item === pagina ? "page" : undefined}
                className={`flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-semibold tabular-nums transition-colors ${
                  item === pagina
                    ? "border-acento bg-acento text-white"
                    : "border-borda bg-superficie text-texto-2 hover:border-acento/60 hover:bg-superficie-2 hover:text-texto"
                }`}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ol>

      {pagina < totalPaginas ? (
        <Link href={href(pagina + 1)} rel="next" aria-label="Próxima página" className={SETA}>
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m8 4.5 5.5 5.5L8 15.5" />
          </svg>
        </Link>
      ) : (
        <span className={`${SETA} pointer-events-none opacity-40`} aria-hidden="true">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m8 4.5 5.5 5.5L8 15.5" />
          </svg>
        </span>
      )}
    </nav>
  );
}
