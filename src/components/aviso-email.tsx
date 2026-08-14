"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const DESTINO = "/verificar-email";

/**
 * Faixa mostrada no topo da plataforma enquanto o e-mail não é confirmado.
 *
 * Some na própria tela de confirmação: ali ela mandaria a pessoa para onde ela
 * já está, e ainda empurrava para baixo o cartão que aquela tela centraliza.
 */
export function AvisoEmail() {
  const caminho = usePathname();
  if (caminho === DESTINO) return null;

  return (
    <div className="border-borda-suave bg-acento/10 border-b">
      <div className="calha flex w-full flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="text-acento h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
          <path d="m3 6 7 5 7-5" />
        </svg>
        <span className="text-texto-2">Confirme seu e-mail para não perder avisos.</span>
        <Link
          href={DESTINO}
          className="text-acento hover:text-acento-hover font-semibold underline-offset-2 hover:underline"
        >
          Confirmar agora
        </Link>
      </div>
    </div>
  );
}
