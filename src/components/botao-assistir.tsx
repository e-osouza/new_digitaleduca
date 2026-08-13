"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ModalPlayer, type AulaDoModal } from "@/components/modal-player";

/**
 * Gatilho de reprodução da página do conteúdo.
 *
 * Abre o vídeo em tela cheia sobre a própria página, em vez de navegar para
 * `/assistir`. Assim quem vai ver uma aula não perde o contexto — ao fechar,
 * continua exatamente onde estava, com a descrição e a lista à vista.
 *
 * A rota `/assistir` continua existindo e é a que atende a lista de aulas da
 * página, o "continuar assistindo" e quem chega por link direto.
 */
export function BotaoAssistir({
  aulas,
  inicialId,
  rotulo,
  abrirAoCarregar = false,
}: {
  aulas: AulaDoModal[];
  /** Aula em que o modal abre; as demais ficam na lista lateral. */
  inicialId: number;
  rotulo: string;
  /**
   * Abre o player já na primeira renderização. É o que faz os cards de
   * "continuar assistindo" caírem direto no vídeo: eles apontam para a página
   * do conteúdo com `?assistir=1`, e ao fechar a pessoa já está nela.
   */
  abrirAoCarregar?: boolean;
}) {
  /*
   * Estado inicial, e não um efeito: assim o modal já nasce aberto, sem o
   * quadro intermediário em que a página aparece atrás antes de ele subir.
   */
  const [aberto, setAberto] = useState(abrirAoCarregar);
  const router = useRouter();
  const caminho = usePathname();

  /*
   * Tira o `?assistir=1` da barra de endereços assim que o player abre. Sem
   * isso, recarregar a página ou voltar no histórico reabriria o vídeo, e a
   * URL guardada nos favoritos nunca mostraria a ficha do conteúdo.
   */
  useEffect(() => {
    if (abrirAoCarregar) router.replace(caminho, { scroll: false });
  }, [abrirAoCarregar, router, caminho]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="bg-acento text-white hover:bg-acento-hover inline-flex min-h-11 items-center gap-2 rounded-full px-6 text-sm font-bold transition-colors"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4" fill="currentColor">
          <path d="M4 2.5v11l9-5.5-9-5.5Z" />
        </svg>
        {rotulo}
      </button>

      <ModalPlayer
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        aulas={aulas}
        inicialId={inicialId}
      />
    </>
  );
}
