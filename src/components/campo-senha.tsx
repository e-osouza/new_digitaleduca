"use client";

import { useId, useState } from "react";

/**
 * Campo de senha com botão de revelar.
 *
 * Digitar senha às cegas é a maior fonte de erro nestas telas, ainda mais no
 * celular. O botão fica DENTRO da caixa e é um `<button>` de verdade, com
 * rótulo e `aria-pressed` — alcançável por teclado e anunciado por leitor de
 * tela, ao contrário do ícone decorativo que costuma ocupar esse lugar.
 */
export function CampoSenha({
  id,
  rotulo,
  dica,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id?: string;
  rotulo: string;
  dica?: string;
}) {
  const gerado = useId();
  const idCampo = id ?? gerado;
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={idCampo} className="text-texto-2 text-sm font-medium">
        {rotulo}
      </label>

      <div className="relative">
        <input
          id={idCampo}
          {...props}
          type={visivel ? "text" : "password"}
          className="bg-superficie border-borda text-texto placeholder:text-texto-3 focus:border-acento focus:ring-acento/25 w-full rounded-lg border py-2.5 pr-12 pl-3.5 text-sm transition-[border-color,box-shadow] outline-none focus:ring-2"
        />

        <button
          type="button"
          onClick={() => setVisivel((valor) => !valor)}
          aria-pressed={visivel}
          aria-controls={idCampo}
          aria-label={visivel ? "Ocultar a senha" : "Mostrar a senha"}
          className="text-texto-3 hover:text-texto focus-visible:outline-acento absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md transition-colors focus-visible:outline-2"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="h-[18px] w-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1.8 10S4.9 4.6 10 4.6 18.2 10 18.2 10 15.1 15.4 10 15.4 1.8 10 1.8 10Z" />
            <circle cx="10" cy="10" r="2.6" />
            {visivel && <path d="m3.5 16.5 13-13" />}
          </svg>
        </button>
      </div>

      {dica && <p className="text-texto-3 text-xs">{dica}</p>}
    </div>
  );
}
