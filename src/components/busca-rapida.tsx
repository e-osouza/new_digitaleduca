"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function BuscaRapida() {
  const router = useRouter();
  const parametros = useSearchParams();
  const [termo, setTermo] = useState(parametros.get("q") ?? "");

  return (
    <form
      role="search"
      onSubmit={(evento) => {
        evento.preventDefault();
        const limpo = termo.trim();
        if (limpo.length > 0) router.push(`/buscar?q=${encodeURIComponent(limpo)}`);
      }}
      className="relative"
    >
      <label htmlFor="busca" className="sr-only">
        Buscar conteúdos
      </label>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="text-texto-3 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="9" cy="9" r="6" />
        <path d="m14 14 4 4" strokeLinecap="round" />
      </svg>
      <input
        id="busca"
        type="search"
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
        placeholder="Buscar"
        // 16px no celular de propósito: abaixo disso o iOS dá zoom ao focar o
        // campo. A partir de sm voltamos para a escala do resto da interface.
        className="bg-superficie border-borda-suave text-texto placeholder:text-texto-3 focus:border-acento ease-suave h-11 w-28 rounded-full border pr-3 pl-9 text-base transition-[width,border-color] duration-300 outline-none focus:w-48 sm:h-10 sm:w-40 sm:text-sm sm:focus:w-64"
      />
    </form>
  );
}
