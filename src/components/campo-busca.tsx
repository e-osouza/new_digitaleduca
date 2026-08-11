"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Campo de busca da própria página de resultados — maior que o do cabeçalho e
 * já preenchido com o termo atual, para refinar sem precisar reescrever.
 */
export function CampoBusca({
  termoInicial = "",
  tipo,
}: {
  termoInicial?: string;
  /** Mantido ao refinar: trocar o termo não deve descartar o filtro de tipo. */
  tipo?: string;
}) {
  const router = useRouter();
  const [termo, setTermo] = useState(termoInicial);

  function buscar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const limpo = termo.trim();
    if (limpo.length === 0) return;

    const parametros = new URLSearchParams({ q: limpo });
    if (tipo) parametros.set("tipo", tipo);
    router.push(`/buscar?${parametros.toString()}`);
  }

  return (
    <form role="search" onSubmit={buscar} className="relative max-w-xl">
      <label htmlFor="busca-pagina" className="sr-only">
        Buscar conteúdos
      </label>

      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="text-texto-3 pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="9" cy="9" r="6" />
        <path d="m14 14 4 4" strokeLinecap="round" />
      </svg>

      <input
        id="busca-pagina"
        type="search"
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
        placeholder="Buscar aulas, palestras e podcasts"
        autoComplete="off"
        // 16px no celular evita o zoom automático do iOS ao focar.
        className="bg-superficie border-borda text-texto placeholder:text-texto-3 focus:border-acento h-14 w-full rounded-full border pr-28 pl-12 text-base transition-colors outline-none"
      />

      <button
        type="submit"
        className="bg-acento text-fundo hover:bg-acento-hover absolute top-1/2 right-2 flex h-10 -translate-y-1/2 items-center rounded-full px-5 text-sm font-bold transition-colors"
      >
        Buscar
      </button>
    </form>
  );
}
