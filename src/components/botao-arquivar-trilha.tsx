"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Arquivar some com a trilha da listagem. A API marca `archivedAt` em vez de
 * apagar, mas o usuário não tem como desfazer pela interface — por isso pede
 * confirmação explícita antes.
 */
export function BotaoArquivarTrilha({ trilhaId }: { trilhaId: number }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function arquivar() {
    setEnviando(true);
    setErro("");

    try {
      const resposta = await fetch(`/api/trilhas/${trilhaId}`, {
        method: "DELETE",
      });

      if (!resposta.ok) {
        const corpo = (await resposta.json().catch(() => ({}))) as {
          erro?: string;
        };
        setErro(corpo.erro ?? "Não foi possível arquivar.");
        setEnviando(false);
        return;
      }

      router.replace("/trilhas");
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
        Arquivar
      </button>
    );
  }

  return (
    <div className="border-alerta/40 bg-alerta/10 flex flex-col gap-3 rounded-xl border p-4">
      <p className="text-sm">
        Arquivar esta trilha? Ela sai da sua lista e não dá para desfazer por
        aqui.
      </p>

      {erro && (
        <p role="alert" className="text-alerta text-xs">
          {erro}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={arquivar}
          disabled={enviando}
          className="bg-alerta flex min-h-10 items-center rounded-full px-5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
        >
          {enviando ? "Arquivando…" : "Sim, arquivar"}
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
