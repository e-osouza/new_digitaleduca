import type { ReactNode } from "react";

/**
 * Cartão de número do cabeçalho: ícone, valor em destaque, rótulo e uma
 * qualificação curta embaixo.
 *
 * A qualificação não é enfeite — é ela que diz o que o número mede ("no
 * total", "em andamento"). Sem isso, "0" e "1" soltos ficam ambíguos.
 */
export function Estatistica({
  valor,
  rotulo,
  detalhe,
  icone,
}: {
  valor: string;
  rotulo: string;
  detalhe: string;
  /** Traçado desenhado num viewBox 0 0 20 20, como no resto da interface. */
  icone: ReactNode;
}) {
  return (
    <div className="border-borda-suave bg-superficie flex items-center gap-3.5 rounded-xl border p-4 sm:gap-4 sm:p-5">
      <span
        aria-hidden="true"
        className="bg-acento-claro/15 text-acento-claro flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
      >
        <svg
          viewBox="0 0 20 20"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icone}
        </svg>
      </span>

      <div className="flex min-w-0 flex-col">
        <span className="font-display text-texto text-2xl leading-tight font-semibold tabular-nums">
          {valor}
        </span>
        <span className="text-texto text-sm font-semibold">{rotulo}</span>
        <span className="text-texto-3 text-xs">{detalhe}</span>
      </div>
    </div>
  );
}

/** Traçados dos ícones usados nos cartões de estatística. */
export const ICONES_ESTATISTICA = {
  livro: (
    <>
      <path d="M10 5.5v11" />
      <path d="M10 5.5C8.6 4.4 6.9 3.9 5 4v10c1.9-.1 3.6.4 5 1.5" />
      <path d="M10 5.5C11.4 4.4 13.1 3.9 15 4v10c-1.9-.1-3.6.4-5 1.5" />
    </>
  ),
  capelo: (
    <>
      <path d="m2.5 7.5 7.5-3.5 7.5 3.5-7.5 3.5z" />
      <path d="M5.5 9v4c0 1.1 2 2 4.5 2s4.5-.9 4.5-2V9" />
    </>
  ),
  relogio: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l2.5 1.5" />
    </>
  ),
} as const;
