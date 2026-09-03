"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Quanto o ponteiro precisa andar para o gesto virar arraste, e não clique. */
const LIMIAR_ARRASTE = 6;

/**
 * A faixa que rola: arraste com o mouse e um par de setas embaixo.
 *
 * O trilho sempre rolou nativamente — toque, trackpad e teclado. O que faltava
 * era o mouse de mesa: sem barra visível (a `.trilho` a esconde) e sem gesto de
 * arraste, quem usa mouse com roda só via os dois primeiros cards e não tinha
 * como saber que havia mais.
 *
 * Só o miolo é cliente. O cabeçalho do trilho e os cards seguem renderizados no
 * servidor e chegam aqui como `children` — o JavaScript que desce é o desta
 * mecânica, não o do catálogo.
 */
export function FaixaRolavel({ children }: { children: React.ReactNode }) {
  const faixa = useRef<HTMLDivElement>(null);
  const [arrastando, setArrastando] = useState(false);
  const [limites, setLimites] = useState({ inicio: true, fim: true });

  /*
   * O estado do arraste vive em ref, não em estado: ele muda a cada
   * `pointermove` (dezenas de vezes por segundo) e nada na tela depende dele
   * além do cursor, que é o único pedaço que virou estado.
   */
  const gesto = useRef({
    ativo: false,
    x: 0,
    scroll: 0,
    moveu: false,
    ponteiro: -1,
  });

  /** Em qual ponta a faixa está — é o que acende e apaga cada seta. */
  const medir = useCallback(() => {
    const el = faixa.current;
    if (!el) return;
    // 2px de folga: larguras fracionárias nunca fecham a conta exatamente.
    const sobra = el.scrollWidth - el.clientWidth - el.scrollLeft;
    setLimites({ inicio: el.scrollLeft <= 2, fim: sobra <= 2 });
  }, []);

  useEffect(() => {
    const el = faixa.current;
    if (!el) return;

    /*
     * A primeira medição entra num quadro seguinte de propósito: medir dentro
     * do efeito seria escrever estado no meio da montagem, e o layout ainda
     * pode não ter assentado — imagem sem dimensão, fonte trocando.
     */
    const quadro = requestAnimationFrame(medir);

    el.addEventListener("scroll", medir, { passive: true });
    /* Trocar de aba ou girar o celular muda quanto cabe, não só onde estamos. */
    const observador = new ResizeObserver(medir);
    observador.observe(el);

    return () => {
      cancelAnimationFrame(quadro);
      el.removeEventListener("scroll", medir);
      observador.disconnect();
    };
  }, [medir]);

  /**
   * Um "passo" é o maior número de cards inteiros que cabem na janela visível.
   *
   * Rolar por `clientWidth` cru cortaria o card do meio ao fim do movimento e
   * brigaria com o scroll-snap, que o traria de volta. Medindo pelo primeiro
   * filho, o passo termina sempre com um card alinhado na calha.
   */
  function passo(el: HTMLDivElement) {
    const card = el.firstElementChild as HTMLElement | null;
    if (!card) return el.clientWidth;
    const vao = parseFloat(getComputedStyle(el).columnGap || "0") || 0;
    const largura = card.getBoundingClientRect().width + vao;
    return Math.max(largura, Math.floor(el.clientWidth / largura) * largura);
  }

  function deslizar(sentido: -1 | 1) {
    const el = faixa.current;
    if (!el) return;
    el.scrollBy({ left: sentido * passo(el), behavior: "smooth" });
  }

  function aoPressionar(evento: React.PointerEvent<HTMLDivElement>) {
    // Toque e caneta já rolam sozinhos; interceptar só atrapalharia.
    if (evento.pointerType !== "mouse" || evento.button !== 0) return;
    const el = faixa.current;
    if (!el) return;

    gesto.current = {
      ativo: true,
      x: evento.clientX,
      scroll: el.scrollLeft,
      moveu: false,
      ponteiro: evento.pointerId,
    };
  }

  function aoMover(evento: React.PointerEvent<HTMLDivElement>) {
    const g = gesto.current;
    const el = faixa.current;
    if (!g.ativo || !el) return;

    const dx = evento.clientX - g.x;

    /*
     * A captura do ponteiro entra AQUI, e só depois do limiar — nunca no
     * `pointerdown`.
     *
     * Foi o erro da primeira versão: com a captura aberta desde o aperto, o
     * navegador reencaminha para a faixa até o `click` de compatibilidade, e o
     * card parava de abrir no clique simples. Capturando a partir do momento
     * em que o gesto virou arraste, o clique comum segue seu caminho normal —
     * e o clique fantasma do fim do arraste cai na faixa, que é justamente
     * quem sabe engoli-lo.
     */
    if (!g.moveu && Math.abs(dx) > LIMIAR_ARRASTE) {
      g.moveu = true;
      try {
        el.setPointerCapture(g.ponteiro);
      } catch {
        // Sem captura o arraste ainda funciona enquanto o ponteiro não sair.
      }
      setArrastando(true);
    }

    if (g.moveu) el.scrollLeft = g.scroll - dx;
  }

  function aoSoltar() {
    if (!gesto.current.ativo) return;
    gesto.current.ativo = false;
    setArrastando(false);
  }

  /*
   * O clique que nasce do arraste é engolido aqui, na fase de captura.
   *
   * Todo card é um link. Sem isto, largar o mouse depois de puxar a faixa
   * abria o conteúdo que estava embaixo do dedo — o gesto de navegar pela
   * lista virava navegação para fora dela.
   */
  function aoClicarCapturando(evento: React.MouseEvent<HTMLDivElement>) {
    if (!gesto.current.moveu) return;
    gesto.current.moveu = false;
    evento.preventDefault();
    evento.stopPropagation();
  }

  const temRolagem = !(limites.inicio && limites.fim);

  return (
    <>
      <div
        ref={faixa}
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
        onClickCapture={aoClicarCapturando}
        /* Arrastar uma imagem dispararia o drag-and-drop do navegador. */
        onDragStart={(evento) => evento.preventDefault()}
        style={{
          /*
           * O snap sai de cena durante o arraste: ele disputa cada quadro com
           * o `scrollLeft` que escrevemos à mão e a faixa fica emperrada. Ao
           * soltar, ele volta e acomoda o card mais próximo.
           */
          scrollSnapType: arrastando ? "none" : undefined,
        }}
        className={`trilho calha flex gap-3 overflow-x-auto pb-2 sm:gap-4 ${
          arrastando ? "cursor-grabbing select-none" : "sm:cursor-grab"
        }`}
      >
        {children}
      </div>

      {/*
        As setas ficam ABAIXO da faixa e alinhadas à esquerda, na mesma calha do
        título — quem procura o comando olha para o começo da linha, e ali elas
        não cobrem card nenhum, como faria a seta flutuante sobre a borda.

        Aparecem só a partir de `sm`: no celular o dedo arrasta, e dois botões
        roubariam altura de todo trilho para repetir o que o gesto já faz.
      */}
      {temRolagem && (
        <div className="calha hidden items-center gap-2 sm:flex">
          <Seta
            sentido="voltar"
            desativada={limites.inicio}
            onClick={() => deslizar(-1)}
          />
          <Seta
            sentido="avancar"
            desativada={limites.fim}
            onClick={() => deslizar(1)}
          />
        </div>
      )}
    </>
  );
}

function Seta({
  sentido,
  desativada,
  onClick,
}: {
  sentido: "voltar" | "avancar";
  desativada: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desativada}
      aria-label={sentido === "voltar" ? "Voltar" : "Avançar"}
      className="border-borda-suave bg-superficie text-texto-2 hover:border-acento/60 hover:text-texto ease-suave flex h-7 w-7 items-center justify-center rounded-full border transition-colors disabled:opacity-35 disabled:hover:border-borda-suave disabled:hover:text-texto-2"
    >
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className={`h-4 w-4 ${sentido === "voltar" ? "" : "rotate-180"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5l-5 5 5 5" />
      </svg>
    </button>
  );
}
