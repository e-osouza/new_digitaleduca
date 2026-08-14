"use client";

import { useEffect, useState } from "react";

/** Segundos de espera entre dois pedidos de código. */
const ESPERA = 60;

/**
 * "Reenviar código" com espera visível.
 *
 * Sem ela o botão só ficava indisponível durante a requisição, o que na prática
 * é meio segundo: dava para pedir dez códigos em dez cliques. Além do custo de
 * envio, cada pedido novo invalida o anterior — quem clica duas vezes e digita
 * o primeiro código recebe "código inválido" sem entender por quê.
 *
 * A contagem é só da interface. O limite que vale é o do servidor, em
 * `lib/limite.ts`; este botão existe para que ninguém esbarre nele sem querer.
 */
export function BotaoReenviar({
  aoReenviar,
  ocupado = false,
}: {
  /** Deve lançar em caso de falha, para a espera não começar à toa. */
  aoReenviar: () => Promise<void>;
  /** Outra ação do formulário está em andamento. */
  ocupado?: boolean;
}) {
  /** Segundos restantes. `0` = disponível. */
  const [restante, setRestante] = useState(0);
  const [enviando, setEnviando] = useState(false);

  /*
   * Decremento dentro do próprio timer, e não no corpo do efeito: escrever
   * estado direto ali provocaria renders em cascata.
   */
  useEffect(() => {
    if (restante <= 0) return;
    const relogio = setTimeout(() => setRestante(restante - 1), 1000);
    return () => clearTimeout(relogio);
  }, [restante]);

  async function clicar() {
    setEnviando(true);
    try {
      await aoReenviar();
      setRestante(ESPERA);
    } catch {
      // Quem chamou mostra o erro; sem espera, dá para tentar de novo na hora.
    } finally {
      setEnviando(false);
    }
  }

  const esperando = restante > 0;

  return (
    <button
      type="button"
      onClick={clicar}
      disabled={ocupado || enviando || esperando}
      className="text-acento hover:text-acento-hover w-fit text-sm font-semibold transition-colors disabled:opacity-60"
    >
      {enviando
        ? "Enviando…"
        : esperando
          ? `Reenviar em ${restante}s`
          : "Reenviar código"}
    </button>
  );
}
