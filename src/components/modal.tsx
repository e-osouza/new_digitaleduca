"use client";

import { useEffect, useId, useRef } from "react";

/**
 * Modal da plataforma, apoiado no <dialog> nativo: foco preso, Esc e camada
 * superior vêm prontos do navegador — e nenhum `overflow: hidden` de ancestral
 * recorta o diálogo.
 *
 * O que o nativo NÃO dá, e mora aqui: fechar ao clicar fora. Como o ::backdrop
 * é pseudo-elemento, o clique nele chega ao próprio <dialog>; com padding zero
 * na caixa, alvo === diálogo significa exatamente "fora do conteúdo".
 *
 * A animação de abrir e fechar está no globals.css (@starting-style +
 * `transition-behavior: allow-discrete`) e vale para todo <dialog>.
 */
export function Modal({
  aberto,
  aoFechar,
  titulo,
  children,
  largura = "26rem",
  impedirFechar = false,
}: {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  children: React.ReactNode;
  /** Largura máxima; sempre cabe na tela do celular. */
  largura?: string;
  /** Segura o modal aberto enquanto uma ação está em curso. */
  impedirFechar?: boolean;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  /*
   * Arrastar de dentro para fora (ao selecionar texto) solta o mouse no
   * backdrop e dispara um clique no diálogo. Só fecha quando o gesto começou
   * e terminou do lado de fora.
   */
  const comecouFora = useRef(false);

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;

    if (aberto && !elemento.open) elemento.showModal();
    if (!aberto && elemento.open) elemento.close();
  }, [aberto]);

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={idTitulo}
      // Esc e qualquer fechamento do navegador precisam avisar quem controla.
      onClose={aoFechar}
      // `cancel` é o Esc, e só ele pode ser barrado antes de o diálogo fechar.
      onCancel={(evento) => {
        if (impedirFechar) evento.preventDefault();
      }}
      onMouseDown={(evento) => {
        comecouFora.current = evento.target === evento.currentTarget;
      }}
      onClick={(evento) => {
        if (impedirFechar) return;
        if (comecouFora.current && evento.target === evento.currentTarget) {
          aoFechar();
        }
      }}
      style={{ width: `min(${largura}, calc(100vw - 2rem))` }}
      className="bg-superficie text-texto border-borda-suave m-auto rounded-2xl border p-0 shadow-xl"
    >
      <div className="flex flex-col gap-5 p-6">
        <h2 id={idTitulo} className="font-display text-lg font-semibold">
          {titulo}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
