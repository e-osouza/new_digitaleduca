"use client";

import Image from "next/image";
import Link from "next/link";
import { formatarRelogio } from "@/lib/format";
import { useReprodutorPodcast } from "@/components/podcast/provedor";

/**
 * Barra fixa no rodapé com o episódio em reprodução.
 *
 * Só existe quando a página do podcast NÃO está em cena — é ela que assume o
 * comando enquanto está aberta. Como o elemento de mídia mora no provedor, e
 * não na página, sair da tela não interrompe nada: esta barra é apenas o novo
 * rosto do mesmo áudio.
 */
export function MiniPlayerPodcast() {
  const {
    episodio,
    naPagina,
    tocando,
    carregando,
    tempo,
    duracao,
    alternar,
    pular,
    fechar,
  } = useReprodutorPodcast();

  if (!episodio || naPagina) return null;

  const progresso = duracao > 0 ? Math.min((tempo / duracao) * 100, 100) : 0;

  return (
    <div className="border-borda-suave bg-cromo/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md">
      {/* Régua rente ao topo da barra: informa sem ocupar altura. */}
      <div className="bg-borda-suave h-0.5 w-full">
        <div className="bg-acento h-full" style={{ width: `${progresso}%` }} />
      </div>

      <div className="calha flex h-16 w-full items-center gap-3 sm:h-[4.5rem] sm:gap-4">
        <Link
          href="/tipo/podcast"
          className="flex min-w-0 flex-1 items-center gap-3"
          aria-label="Voltar ao player do podcast"
        >
          <span className="bg-superficie-2 relative h-11 w-11 shrink-0 overflow-hidden rounded-lg sm:h-12 sm:w-12">
            {episodio.capa && (
              <Image
                src={episodio.capa}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            )}
          </span>

          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">
              {episodio.convidado}
            </span>
            <span className="text-texto-3 truncate text-xs">
              {carregando
                ? "Carregando…"
                : (episodio.tema ??
                  `${formatarRelogio(tempo)} de ${formatarRelogio(duracao)}`)}
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => pular(-15)}
            aria-label="Voltar 15 segundos"
            className="text-texto-2 hover:text-texto hover:bg-superficie-2 hidden h-10 w-10 items-center justify-center rounded-full transition-colors sm:flex"
          >
            <IconePular sentido="tras" />
          </button>

          <button
            type="button"
            onClick={alternar}
            disabled={carregando}
            aria-label={tocando ? "Pausar" : "Tocar"}
            className="bg-acento hover:bg-acento-hover flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors disabled:opacity-60"
          >
            {tocando ? <IconePausa /> : <IconePlay />}
          </button>

          <button
            type="button"
            onClick={() => pular(15)}
            aria-label="Avançar 15 segundos"
            className="text-texto-2 hover:text-texto hover:bg-superficie-2 hidden h-10 w-10 items-center justify-center rounded-full transition-colors sm:flex"
          >
            <IconePular sentido="frente" />
          </button>

          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar o player"
            className="text-texto-3 hover:text-texto hover:bg-superficie-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m5 5 10 10M15 5 5 15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function IconePlay() {
  return (
    <svg viewBox="0 0 16 16" className="ml-0.5 h-4 w-4" fill="currentColor">
      <path d="M4 2.5v11l9-5.5-9-5.5Z" />
    </svg>
  );
}

function IconePausa() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
      <path d="M4.5 3h2.5v10H4.5zM9 3h2.5v10H9z" />
    </svg>
  );
}

/** Seta circular com o "15" no meio, como no player grande. */
function IconePular({ sentido }: { sentido: "tras" | "frente" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-5 w-5 ${sentido === "tras" ? "-scale-x-100" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 4.5a6 6 0 1 0 5.5 3.6" />
      <path d="M15.5 3v5h-5" />
    </svg>
  );
}
