"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Salva ou remove o conteúdo da lista do usuário.
 *
 * `selecionadoId` é o id do VÍNCULO — é ele que a API usa para remover, não o
 * id do conteúdo. Quando vem nulo, o conteúdo ainda não está na lista.
 */
export function BotaoSalvar({
  conteudoId,
  selecionadoId = null,
  rotulo = true,
}: {
  conteudoId: number;
  selecionadoId?: number | null;
  rotulo?: boolean;
}) {
  const router = useRouter();
  const [salvo, setSalvo] = useState(selecionadoId !== null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  async function alternar() {
    setOcupado(true);
    setErro("");

    try {
      const resposta = salvo
        ? await fetch(`/api/minha-lista/${selecionadoId}`, { method: "DELETE" })
        : await fetch("/api/minha-lista", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conteudoId }),
          });

      if (!resposta.ok) {
        const corpo = (await resposta.json().catch(() => ({}))) as {
          erro?: string;
        };
        setErro(corpo.erro ?? "Não foi possível concluir.");
        return;
      }

      setSalvo(!salvo);
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setOcupado(false);
    }
  }

  // Sem o id do vínculo não há como remover; o refresh da página o traz.
  const podeRemover = !salvo || selecionadoId !== null;

  return (
    <span className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={alternar}
        disabled={ocupado || !podeRemover}
        aria-pressed={salvo}
        title={salvo ? "Remover da minha lista" : "Salvar na minha lista"}
        className={`flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors disabled:opacity-60 ${
          salvo
            ? "border-acento bg-acento/10 text-acento"
            : "border-borda bg-superficie text-texto hover:border-acento/60 hover:bg-superficie-2"
        }`}
      >
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
          fill={salvo ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        >
          <path d="M5.5 3h9a1 1 0 0 1 1 1v13l-5.5-3.5L4.5 17V4a1 1 0 0 1 1-1Z" />
        </svg>
        {rotulo && (salvo ? "Salvo" : "Salvar")}
      </button>

      {erro && (
        <span role="alert" className="text-alerta text-xs">
          {erro}
        </span>
      )}
    </span>
  );
}
