"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Tema } from "@/lib/tema";

const OPCOES: { valor: Tema; rotulo: string; descricao: string }[] = [
  { valor: "claro", rotulo: "Claro", descricao: "Fundo claro, padrão." },
  { valor: "escuro", rotulo: "Escuro", descricao: "Melhor à noite." },
];

export function SeletorTema({ atual }: { atual: Tema }) {
  const router = useRouter();
  const [salvando, setSalvando] = useState<Tema | null>(null);

  async function escolher(tema: Tema) {
    if (tema === atual) return;
    setSalvando(tema);

    try {
      await fetch("/api/tema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema }),
      });
      // O tema vive num cookie lido pelo layout do servidor.
      router.refresh();
    } finally {
      setSalvando(null);
    }
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">Aparência</legend>

      <div className="grid gap-3 sm:grid-cols-2">
        {OPCOES.map((opcao) => {
          const ativo = opcao.valor === atual;

          return (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => escolher(opcao.valor)}
              aria-pressed={ativo}
              disabled={salvando !== null}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors disabled:opacity-60 ${
                ativo
                  ? "border-acento bg-acento/10"
                  : "border-borda-suave hover:border-acento/50 hover:bg-superficie-2"
              }`}
            >
              <Amostra tema={opcao.valor} />

              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold">
                  {opcao.rotulo}
                  {salvando === opcao.valor ? " …" : ""}
                </span>
                <span className="text-texto-3 text-xs">{opcao.descricao}</span>
              </span>

              <span
                aria-hidden="true"
                className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  ativo ? "border-acento bg-acento" : "border-borda"
                }`}
              >
                {ativo && (
                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="var(--color-fundo)" strokeWidth="2">
                    <path d="M2.5 6.2 4.8 8.5 9.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Miniatura estática da interface no tema, com as cores reais de cada um. */
function Amostra({ tema }: { tema: Tema }) {
  const claro = tema === "claro";

  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-14 shrink-0 overflow-hidden rounded-md border"
      style={{
        borderColor: claro ? "#c3d5e4" : "#205d75",
        background: claro ? "#f4f8fb" : "#04121d",
      }}
    >
      <span
        className="h-full w-4 shrink-0"
        style={{ background: claro ? "#eaf1f8" : "#0a0f18" }}
      />
      <span className="flex flex-1 flex-col justify-center gap-1 px-1.5">
        <span
          className="h-1 w-full rounded-full"
          style={{ background: claro ? "#0d7ba6" : "#14bade" }}
        />
        <span
          className="h-1 w-2/3 rounded-full"
          style={{ background: claro ? "#c3d5e4" : "#33546f" }}
        />
      </span>
    </span>
  );
}
