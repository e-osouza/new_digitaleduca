import Link from "next/link";
import { FaixaRolavel } from "@/components/faixa-rolavel";

/**
 * Faixa horizontal de cards. A rolagem é nativa (classe `.trilho` em
 * globals.css) — toque, trackpad e teclado —, e a `FaixaRolavel` acrescenta o
 * arraste com o mouse e as setas de passo, que é o que faltava para quem usa
 * mouse de mesa.
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
            <p className="text-texto-3 truncate text-xs sm:text-sm">
              {descricao}
            </p>
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

      <FaixaRolavel>{children}</FaixaRolavel>
    </section>
  );
}
