import Link from "next/link";
import { FAIXA } from "@/lib/ui";

/**
 * Mostrado quando a API recusa um conteúdo por falta de assinatura ativa.
 * Antes esse caso estourava como erro de execução na página.
 */
export function SemAcesso({
  voltarPara = "/inicio",
  titulo = "Conteúdo exclusivo para assinantes",
}: {
  voltarPara?: string;
  titulo?: string;
}) {
  return (
    <div className={`${FAIXA} flex max-w-2xl flex-col items-start gap-6 py-16 sm:py-24`}>
      <span className="bg-acento/15 text-acento flex h-12 w-12 items-center justify-center rounded-full">
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="8.5" width="12" height="8" rx="2" />
          <path d="M6.75 8.5V6a3.25 3.25 0 0 1 6.5 0v2.5" />
        </svg>
      </span>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {titulo}
        </h1>
        <p className="text-texto-2 max-w-lg leading-relaxed">
          Sua conta está ativa, mas este item faz parte do acervo premium. Com a
          assinatura você libera todos os cursos, palestras e podcasts — e os
          conteúdos novos que entram toda quinzena.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/planos"
          className="bg-acento text-fundo hover:bg-acento-hover flex min-h-12 items-center rounded-full px-7 text-sm font-bold transition-colors"
        >
          Ver planos
        </Link>
        <Link
          href={voltarPara}
          className="border-borda bg-superficie text-texto hover:border-acento/60 hover:bg-superficie-2 flex min-h-12 items-center rounded-full border px-7 text-sm font-semibold transition-colors"
        >
          Voltar
        </Link>
      </div>

      <p className="text-texto-3 text-sm">
        Procurando algo grátis?{" "}
        <Link href="/inicio" className="text-acento hover:text-acento-claro font-semibold">
          Veja o que está liberado
        </Link>
        .
      </p>
    </div>
  );
}
