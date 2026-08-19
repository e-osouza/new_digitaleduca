"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * Sino de notificações do cabeçalho.
 *
 * O painel nasce vazio, e isso não é um estado de carregamento: a API não tem
 * como listar avisos de um usuário. O que existe em `/notificacoes` é o
 * registro do token de push (`POST|DELETE /notificacoes/push-token`) e o
 * disparo, que é de SUPERADMIN — ou seja, os avisos saem daqui para o
 * aparelho e nunca voltam para a plataforma como um histórico.
 *
 * Por isso o painel não finge uma caixa de entrada: diz por onde os avisos
 * realmente chegam e leva a quem decide se quer recebê-los. Quando o backend
 * expuser uma listagem, é este componente que ganha a busca e a contagem por
 * cima do sino.
 */
export function Notificacoes() {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        aria-label="Notificações"
        title="Notificações"
        className={`border-borda hover:border-acento/60 hover:bg-superficie-2 hover:text-texto flex h-11 w-11 items-center justify-center rounded-full border transition-colors sm:h-10 sm:w-10 ${
          aberto ? "bg-superficie-2 text-texto" : "text-texto-2"
        }`}
      >
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 8a5 5 0 0 0-10 0c0 4-1.5 5.5-1.5 5.5h13S15 12 15 8Z" />
          <path d="M11.7 16a2 2 0 0 1-3.4 0" />
        </svg>
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-label="Notificações"
          /*
            Ancorado à direita porque o sino é o último item do cabeçalho —
            abrir para a esquerda jogaria o painel para fora da tela. No
            celular ele descola das paredes com a margem negativa do `right`.
          */
          className="border-borda-suave bg-superficie animate-subir absolute right-0 z-50 mt-2 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-3 rounded-2xl border p-4 shadow-xl"
        >
          <h2 className="font-display text-sm font-semibold">Notificações</h2>

          <div className="border-borda-suave flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center">
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="text-texto-3 h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 8a5 5 0 0 0-10 0c0 4-1.5 5.5-1.5 5.5h13S15 12 15 8Z" />
              <path d="M11.7 16a2 2 0 0 1-3.4 0" />
            </svg>
            <p className="text-texto-2 text-sm font-medium">Nada por aqui</p>
            <p className="text-texto-3 text-xs leading-relaxed">
              Os avisos de conteúdo novo chegam pelo aplicativo, direto no seu
              aparelho.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <Link
              href="/conta"
              onClick={() => setAberto(false)}
              className="text-texto-2 hover:bg-superficie-2 hover:text-texto flex min-h-10 items-center rounded-lg px-3 text-sm transition-colors"
            >
              Escolher o que receber
            </Link>
            <Link
              href="/aplicativo"
              onClick={() => setAberto(false)}
              className="text-texto-2 hover:bg-superficie-2 hover:text-texto flex min-h-10 items-center rounded-lg px-3 text-sm transition-colors"
            >
              Baixar o aplicativo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
