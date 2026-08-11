import Link from "next/link";

/** Faixa mostrada no topo da plataforma enquanto o e-mail não é confirmado. */
export function AvisoEmail() {
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
          href="/verificar-email"
          className="text-acento hover:text-acento-hover font-semibold underline-offset-2 hover:underline"
        >
          Confirmar agora
        </Link>
      </div>
    </div>
  );
}
