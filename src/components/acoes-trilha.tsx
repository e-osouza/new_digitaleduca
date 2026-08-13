"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";

/**
 * Reticências no canto do card da trilha. O clique abre a confirmação de
 * exclusão — a API marca `archivedAt` em vez de apagar, mas pela interface não
 * há como voltar atrás, então a pergunta é explícita.
 *
 * Fica fora do <Link> do card (botão dentro de âncora é HTML inválido): o card
 * posiciona os dois como irmãos e este vem por cima.
 */
export function AcoesTrilha({
  trilhaId,
  titulo,
}: {
  trilhaId: number;
  titulo: string;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  function abrir() {
    setErro("");
    setAberto(true);
  }

  function fechar() {
    setAberto(false);
  }

  async function excluir() {
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
        setErro(corpo.erro ?? "Não foi possível excluir a trilha.");
        setEnviando(false);
        return;
      }

      setEnviando(false);
      setAberto(false);
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente de novo.");
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        aria-label={`Excluir a trilha ${titulo}`}
        aria-haspopup="dialog"
        className="bg-fundo/85 text-texto-2 hover:bg-fundo hover:text-texto absolute top-2 right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm hover:scale-105 active:scale-95"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5" fill="currentColor">
          <circle cx="10" cy="4.5" r="1.6" />
          <circle cx="10" cy="10" r="1.6" />
          <circle cx="10" cy="15.5" r="1.6" />
        </svg>
      </button>

      <Modal
        aberto={aberto}
        aoFechar={fechar}
        impedirFechar={enviando}
        titulo="Excluir esta trilha?"
      >
        <p className="text-texto-3 -mt-3 text-sm leading-relaxed">
          <span className="text-texto-2 font-medium">{titulo}</span> sai da sua
          lista e não dá para desfazer por aqui. As aulas continuam disponíveis
          no catálogo.
        </p>

        {erro && (
          <p role="alert" className="text-alerta text-sm">
            {erro}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={fechar}
            disabled={enviando}
            className="border-borda bg-superficie hover:bg-superficie-2 flex min-h-11 items-center rounded-full border px-5 text-sm font-semibold disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={excluir}
            disabled={enviando}
            className="bg-alerta flex min-h-11 items-center rounded-full px-5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-60"
          >
            {enviando ? "Excluindo…" : "Excluir trilha"}
          </button>
        </div>
      </Modal>
    </>
  );
}
