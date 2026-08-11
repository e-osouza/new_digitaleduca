"use client";

import { useState } from "react";

const NOTAS = [1, 2, 3, 4, 5];

/**
 * Estrelas de avaliação da aula. A API faz upsert, então trocar a nota apenas
 * substitui a anterior.
 */
export function Avaliacao({
  videoId,
  notaInicial,
  media,
  total,
}: {
  videoId: number;
  notaInicial: number | null;
  media: number;
  total: number;
}) {
  const [nota, setNota] = useState(notaInicial);
  const [previa, setPrevia] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const exibida = previa ?? nota ?? 0;

  async function avaliar(valor: number) {
    setEnviando(true);
    setErro("");
    const anterior = nota;
    setNota(valor);

    try {
      const resposta = await fetch("/api/avaliacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, nota: valor }),
      });

      if (!resposta.ok) {
        const corpo = (await resposta.json().catch(() => ({}))) as {
          erro?: string;
        };
        setNota(anterior);
        setErro(corpo.erro ?? "Não foi possível registrar sua nota.");
      }
    } catch {
      setNota(anterior);
      setErro("Falha de conexão.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setPrevia(null)}
      >
        {NOTAS.map((valor) => (
          <button
            key={valor}
            type="button"
            disabled={enviando}
            onClick={() => avaliar(valor)}
            onMouseEnter={() => setPrevia(valor)}
            onFocus={() => setPrevia(valor)}
            onBlur={() => setPrevia(null)}
            aria-label={`Dar nota ${valor} de 5`}
            aria-pressed={nota === valor}
            className="text-acento p-0.5 transition-transform duration-150 hover:scale-115 disabled:opacity-60"
          >
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="h-6 w-6"
              fill={valor <= exibida ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            >
              <path d="m10 2.5 2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.48l-4.7 2.47.9-5.23-3.8-3.7 5.25-.76L10 2.5Z" />
            </svg>
          </button>
        ))}
      </div>

      <p className="text-texto-3 text-sm">
        {nota ? (
          <>
            Sua nota: <span className="text-texto-2 font-semibold">{nota}</span>
          </>
        ) : (
          "Avalie esta aula"
        )}
        {total > 0 && (
          <>
            {" · "}
            <span className="tabular-nums">
              {media.toFixed(1)} de {total}{" "}
              {total === 1 ? "avaliação" : "avaliações"}
            </span>
          </>
        )}
      </p>

      {erro && (
        <p role="alert" className="text-alerta text-xs">
          {erro}
        </p>
      )}
    </div>
  );
}
