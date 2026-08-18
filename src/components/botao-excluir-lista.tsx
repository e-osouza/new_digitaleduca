"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Exclui a lista de vez. A API apaga o registro (e, por cascade, os itens e o
 * progresso) — não há como desfazer, então pede confirmação explícita antes.
 */
export function BotaoExcluirLista({ listaId }: { listaId: number }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function excluir() {
    setEnviando(true);
    setErro("");

    try {
      const resposta = await fetch(`/api/listas/${listaId}`, {
        method: "DELETE",
      });

      if (!resposta.ok) {
        const corpo = (await resposta.json().catch(() => ({}))) as {
          erro?: string;
        };
        setErro(corpo.erro ?? "Não foi possível excluir.");
        setEnviando(false);
        return;
      }

      router.replace("/listas");
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
      setEnviando(false);
    }
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="border-borda bg-superficie text-texto-2 hover:border-alerta/60 hover:text-alerta flex min-h-11 shrink-0 items-center rounded-full border px-5 text-sm font-semibold transition-colors"
      >
        Excluir lista
      </button>
    );
  }

  return (
    <div className="border-alerta/40 bg-alerta/10 flex flex-col gap-3 rounded-xl border p-4">
      <p className="text-sm">
        Excluir esta lista? Ela é apagada de vez, junto com o progresso dela — e
        não dá para desfazer. As aulas em si continuam no catálogo.
      </p>

      {erro && (
        <p role="alert" className="text-alerta text-xs">
          {erro}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={excluir}
          disabled={enviando}
          className="bg-alerta flex min-h-10 items-center rounded-full px-5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
        >
          {enviando ? "Excluindo…" : "Sim, excluir"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          disabled={enviando}
          className="border-borda bg-superficie hover:bg-superficie-2 flex min-h-10 items-center rounded-full border px-5 text-sm font-semibold transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
