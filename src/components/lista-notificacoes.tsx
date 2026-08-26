"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ItemNotificacao } from "@/components/notificacao-item";
import type { Notificacao } from "@/types/api";

/**
 * A caixa de entrada inteira, na página `/notificacoes`.
 *
 * Os avisos chegam prontos do servidor — a página é uma listagem como as
 * outras da plataforma, e não uma tela em branco esperando fetch. O cliente
 * entra só onde é preciso: marcar como lida muda o estado da linha na hora,
 * sem recarregar a lista debaixo do dedo de quem clicou.
 *
 * Abrir a página NÃO marca tudo como lido. Uma pessoa entra aqui justamente
 * para achar o que ainda não viu; zerar o contador na chegada apagaria a única
 * pista que ela tem do que falta ler.
 */
export function ListaNotificacoes({ itens }: { itens: Notificacao[] }) {
  const router = useRouter();
  /*
   * O estado local guarda o que foi lido AQUI, e não uma cópia da lista.
   *
   * Espelhar `itens` obrigaria a ressincronizar a cada troca de página — o
   * efeito que copia prop para estado, que sempre atrasa um render. Guardando
   * só os ids, a lista continua sendo a do servidor e a leitura otimista é uma
   * camada por cima: ids de outra página no conjunto não incomodam ninguém.
   */
  const [lidas, setLidas] = useState<ReadonlySet<number>>(new Set());
  const [tudoLido, setTudoLido] = useState(false);
  const [marcandoTudo, setMarcandoTudo] = useState(false);

  const lista = itens.map((n) =>
    n.lida || tudoLido || lidas.has(n.id) ? { ...n, lida: true } : n,
  );
  const naoLidas = lista.filter((n) => !n.lida).length;

  async function marcar(id?: number) {
    // Otimista: a interface já reflete o resultado esperado.
    if (id === undefined) {
      setTudoLido(true);
      setMarcandoTudo(true);
    } else {
      setLidas((atuais) => new Set(atuais).add(id));
    }

    await fetch("/api/notificacoes/ler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : {}),
    }).catch(() => {});

    setMarcandoTudo(false);
    /* Sincroniza o contador do sino, que é renderizado pelo servidor. */
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-texto-3 text-[11px] font-semibold tracking-[0.14em] uppercase">
          {naoLidas > 0 ? (
            <span className="tabular-nums">
              {naoLidas} não {naoLidas === 1 ? "lida" : "lidas"}
            </span>
          ) : (
            "Tudo lido"
          )}
        </p>

        {naoLidas > 0 && (
          <button
            type="button"
            onClick={() => marcar()}
            disabled={marcandoTudo}
            className="text-texto-3 hover:text-acento text-sm font-medium transition-colors disabled:opacity-60"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      <ul className="border-borda-suave divide-borda-suave bg-superficie divide-y overflow-hidden rounded-2xl border shadow-sm">
        {lista.map((n) => (
          <li key={n.id}>
            <ItemNotificacao notificacao={n} aoLer={marcar} />
          </li>
        ))}
      </ul>
    </div>
  );
}
