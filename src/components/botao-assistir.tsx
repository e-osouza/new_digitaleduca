"use client";

import { usePlayerConteudo } from "@/components/player-conteudo";

/**
 * Botão "Assistir agora" da ficha do conteúdo.
 *
 * Só aciona — quem é dono do player é o `ProvedorPlayerConteudo`, porque a
 * lista de aulas abre o MESMO modal. Ver a nota lá.
 */
export function BotaoAssistir({ rotulo }: { rotulo: string }) {
  const player = usePlayerConteudo();
  if (!player) return null;

  const { abrirAula, prepararPlayer, aulas } = player;
  const primeira = aulas[0];
  if (!primeira) return null;

  return (
    <button
      type="button"
      onClick={() => abrirAula(primeira.id)}
      /*
       * O chunk começa a baixar quando o ponteiro chega ao botão ou ele recebe
       * o foco — antes do clique, portanto.
       */
      onPointerEnter={prepararPlayer}
      onFocus={prepararPlayer}
      className="bg-acento text-white hover:bg-acento-hover inline-flex min-h-11 items-center gap-2 rounded-full px-6 text-sm font-bold transition-colors"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4" fill="currentColor">
        <path d="M4 2.5v11l9-5.5-9-5.5Z" />
      </svg>
      {rotulo}
    </button>
  );
}
