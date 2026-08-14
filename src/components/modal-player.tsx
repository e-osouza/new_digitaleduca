"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Player } from "@/components/player";
import { formatarRelogio } from "@/lib/format";

/** Uma aula reproduzível dentro do modal, já resolvida pelo servidor. */
export type AulaDoModal = {
  id: number;
  titulo: string;
  vimeoId: string;
  duracao: number | null;
  /** Onde a reprodução retoma. Instantâneo do servidor, ver nota abaixo. */
  segundosIniciais: number;
  concluido: boolean;
  /** Título do módulo, quando a aula pertence a um. */
  modulo: string | null;
  /**
   * Item da trilha a que esta aula corresponde. Só existe quando o modal é
   * aberto por dentro de uma trilha — é o que o endpoint de progresso dela
   * espera, junto do `trilhaId` passado ao modal.
   */
  trailItemId?: number | null;
  /**
   * A aula ainda depende da conclusão da anterior. Instantâneo do servidor: ao
   * terminar a anterior aqui dentro, ela libera sem precisar recarregar.
   */
  bloqueada?: boolean;
};

/** Espera antes de emendar a próxima aula, com contagem visível. */
const SEGUNDOS_ATE_PROXIMA = 5;

/**
 * Reprodução em tela cheia, sobre a página do conteúdo.
 *
 * Usa o `<dialog>` nativo pelo mesmo motivo do `Modal`: foco preso, Esc e
 * camada superior vêm prontos do navegador. A diferença é a caixa — aqui ela
 * ocupa a viewport inteira em vez de ser um cartão centrado.
 *
 * Com mais de uma aula, a lista aparece ao lado para trocar de vídeo sem sair
 * do modal, e pode ser recolhida para o vídeo ocupar a largura toda.
 */
export function ModalPlayer({
  aberto,
  aoFechar,
  aulas,
  inicialId,
  trilhaId = null,
}: {
  aberto: boolean;
  aoFechar: () => void;
  aulas: AulaDoModal[];
  inicialId: number;
  /**
   * Trilha de onde as aulas vieram. Quando presente, cada ping do player também
   * avança a barra da trilha — o backend guarda os dois progressos separados.
   */
  trilhaId?: number | null;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  const [atualId, setAtualId] = useState(inicialId);
  const [listaAberta, setListaAberta] = useState(true);
  /** Segundos restantes até a próxima aula. `null` = nenhuma contagem em curso. */
  const [contagem, setContagem] = useState<number | null>(null);
  /**
   * Aulas terminadas nesta sessão do modal. O `concluido` que veio do servidor é
   * um instantâneo da carga da página; sem isto, terminar uma aula não marcaria
   * o ✓ na lista nem liberaria a seguinte numa trilha sequencial.
   */
  const [concluidasAgora, setConcluidasAgora] = useState<ReadonlySet<number>>(
    () => new Set(),
  );

  const indiceAtual = aulas.findIndex((aula) => aula.id === atualId);
  const atual = aulas[indiceAtual] ?? aulas[0];
  const proxima = aulas[indiceAtual + 1] ?? null;
  const temLista = aulas.length > 1;

  const concluidas = useMemo(() => {
    const ids = new Set(concluidasAgora);
    for (const aula of aulas) if (aula.concluido) ids.add(aula.id);
    return ids;
  }, [aulas, concluidasAgora]);

  /*
   * Quem pode ser reproduzida agora. Só a trilha marca aulas como bloqueadas, e
   * a regra dela é uma só: a anterior precisa estar concluída. Como a anterior
   * é a vizinha na lista, terminar uma aula aqui dentro libera a seguinte na
   * hora — o encadeamento automático continua funcionando sem recarregar.
   */
  const liberadas = useMemo(() => {
    const ids = new Set<number>();
    aulas.forEach((aula, indice) => {
      const anterior = aulas[indice - 1];
      if (!aula.bloqueada || !anterior || concluidas.has(anterior.id)) {
        ids.add(aula.id);
      }
    });
    return ids;
  }, [aulas, concluidas]);

  /* Trocar de aula por qualquer via cancela uma contagem em andamento. */
  const trocarAula = useCallback((id: number) => {
    setContagem(null);
    setAtualId(id);
  }, []);

  /*
   * O vídeo acabou. Só encadeia quando existe próxima aula — na última, a
   * reprodução simplesmente termina.
   */
  const aoFinalizar = useCallback(() => {
    setConcluidasAgora((anteriores) => new Set(anteriores).add(atual.id));
    if (proxima) setContagem(SEGUNDOS_ATE_PROXIMA);
  }, [atual.id, proxima]);

  /*
   * Relógio da contagem. Tanto o decremento quanto o avanço acontecem dentro do
   * callback do timer: escrever estado direto no corpo do efeito provocaria
   * renders em cascata.
   */
  useEffect(() => {
    if (contagem === null || !proxima) return;

    const relogio = setTimeout(() => {
      if (contagem <= 1) {
        setAtualId(proxima.id);
        setContagem(null);
      } else {
        setContagem(contagem - 1);
      }
    }, 1000);

    return () => clearTimeout(relogio);
  }, [contagem, proxima]);

  // Preserva a ordem de exibição e agrupa as aulas sob o título do módulo.
  const grupos = useMemo(() => agrupar(aulas), [aulas]);

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;

    if (aberto && !elemento.open) elemento.showModal();
    if (!aberto && elemento.open) elemento.close();
  }, [aberto]);

  /*
   * `showModal` bloqueia a interação com o fundo, mas não a rolagem — sem isto
   * a roda do mouse move a página por trás do vídeo.
   */
  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  /*
   * Só o `onClose` do diálogo revalida, e é por onde todo fechamento passa —
   * botão, Esc e `close()` programático. Chamar `router.refresh()` também no
   * botão dispararia duas revalidações para o mesmo gesto.
   *
   * A página é servida do servidor: sem revalidar, a barra de progresso e o
   * "continuar de onde parou" ficariam com o estado anterior à sessão.
   */
  function aoFecharDialogo() {
    aoFechar();
    router.refresh();
  }

  if (!atual) return null;

  return (
    <dialog
      ref={dialogo}
      aria-label={atual.titulo}
      onClose={aoFecharDialogo}
      // O véu e a animação vêm das regras de `dialog` no globals.css.
      className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-black p-0"
    >
      <div className="flex h-full w-full flex-col">
        <header className="flex shrink-0 items-center gap-2 px-4 py-3 sm:gap-4 sm:px-5">
          <p className="line-clamp-1 flex-1 text-sm font-semibold text-white/95 sm:text-base">
            {atual.titulo}
          </p>

          {temLista && (
            <button
              type="button"
              onClick={() => setListaAberta((valor) => !valor)}
              aria-expanded={listaAberta}
              title={listaAberta ? "Recolher a lista" : "Mostrar a lista"}
              className="ease-suave flex h-10 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium text-white transition-[background-color,transform] duration-150 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white active:scale-95"
            >
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="h-4.5 w-4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 5.5h9M3 10h9M3 14.5h9" />
                <path d="M16.5 5.5v9" />
              </svg>
              <span className="hidden sm:inline">
                {listaAberta ? "Recolher" : "Aulas"}
              </span>
            </button>
          )}

          <BotaoFechar aoClicar={aoFechar} />
        </header>

        {/*
          Com a lista aberta as duas colunas encostam no topo, senão o vídeo
          fica centrado na altura e nasce bem abaixo do primeiro item da lista.
          Sem lista, o centro é o lugar certo.
        */}
        <div
          className={`flex min-h-0 flex-1 flex-col lg:flex-row lg:gap-4 lg:px-4 lg:pb-4 ${
            temLista && listaAberta ? "lg:items-start" : "lg:items-center"
          }`}
        >
          <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center">
            {/*
              O player mantém proporção 16:9 pela largura. O teto em `max-w`
              converte a altura livre de volta em largura, para que numa janela
              baixa e larga o vídeo encolha em vez de vazar por baixo.
            */}
            <div className="relative w-full max-w-[calc((100dvh-8rem)*16/9)]">
              {aberto && (
                /*
                 * `key` força a remontagem ao trocar de aula: o player resolve
                 * a fonte uma vez, no efeito de carga. Sem isso o novo vídeo
                 * nunca seria buscado.
                 */
                <Player
                  key={atual.id}
                  vimeoId={atual.vimeoId}
                  videoId={atual.id}
                  titulo={atual.titulo}
                  segundosIniciais={atual.segundosIniciais}
                  aoFinalizar={aoFinalizar}
                  trilhaId={trilhaId}
                  trailItemId={atual.trailItemId ?? null}
                />
              )}

              {contagem !== null && proxima && (
                <ProximaAula
                  aula={proxima}
                  segundos={contagem}
                  aoAvancar={() => trocarAula(proxima.id)}
                  aoCancelar={() => setContagem(null)}
                />
              )}
            </div>
          </div>

          {/*
            A lista fica montada e anima largura (no desktop) ou altura (no
            celular). Removê-la do DOM ao recolher tornaria a troca instantânea:
            não há o que transicionar num elemento que deixou de existir.
          */}
          {temLista && (
            <aside
              aria-hidden={!listaAberta}
              className={`ease-suave min-h-0 shrink-0 overflow-hidden transition-[max-height,width,opacity] duration-300 lg:max-h-none ${
                listaAberta
                  ? "max-h-[45dvh] opacity-100 lg:w-[340px]"
                  : "pointer-events-none max-h-0 opacity-0 lg:w-0"
              }`}
            >
              {/*
                Largura fixa por dentro: sem isto o texto refluiria a cada
                quadro enquanto a coluna encolhe, e a animação ficaria trêmula.
              */}
              <div className="h-full overflow-y-auto px-4 pb-4 lg:w-[340px] lg:px-0 lg:pb-0">
                <ol className="flex flex-col gap-4">
                  {grupos.map((grupo, indiceGrupo) => (
                    <li key={grupo.modulo ?? `soltas-${indiceGrupo}`}>
                      {grupo.modulo && (
                        <h3 className="mb-2 px-1 text-xs font-semibold tracking-wider text-white/50 uppercase">
                          {grupo.modulo}
                        </h3>
                      )}

                      <ul className="flex flex-col gap-1">
                        {grupo.aulas.map((aula) => (
                          <li key={aula.id}>
                            <ItemAula
                              aula={aula}
                              ativa={aula.id === atual.id}
                              concluida={concluidas.has(aula.id)}
                              liberada={liberadas.has(aula.id)}
                              aoEscolher={() => trocarAula(aula.id)}
                            />
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          )}
        </div>
      </div>
    </dialog>
  );
}

/* ---------------------------------------------------------------- */

function ItemAula({
  aula,
  ativa,
  concluida,
  liberada,
  aoEscolher,
}: {
  aula: AulaDoModal;
  ativa: boolean;
  concluida: boolean;
  /** Falso só nas trilhas, enquanto a aula anterior não terminar. */
  liberada: boolean;
  aoEscolher: () => void;
}) {
  return (
    <button
      type="button"
      onClick={aoEscolher}
      disabled={!liberada}
      aria-current={ativa ? "true" : undefined}
      title={liberada ? undefined : "Conclua a aula anterior"}
      className={`ease-suave flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 ${
        !liberada
          ? "opacity-45"
          : ativa
            ? "bg-white/15"
            : "hover:bg-white/8"
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          concluida
            ? "bg-acento-claro text-fundo"
            : ativa
              ? "text-acento-claro ring-acento-claro ring-1"
              : "text-white/40 ring-1 ring-white/25"
        }`}
      >
        {concluida ? (
          "✓"
        ) : ativa ? (
          "▶"
        ) : !liberada ? (
          <svg viewBox="0 0 20 20" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4.5" y="9" width="11" height="7" rx="1.8" />
            <path d="M7 9V6.8a3 3 0 0 1 6 0V9" />
          </svg>
        ) : (
          ""
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`line-clamp-2 text-sm leading-snug ${
            ativa ? "font-semibold text-white" : "text-white/85"
          }`}
        >
          {aula.titulo}
        </span>
      </span>

      {aula.duracao ? (
        <span className="shrink-0 text-xs tabular-nums text-white/45">
          {formatarRelogio(aula.duracao)}
        </span>
      ) : null}
    </button>
  );
}

/**
 * Sobreposição de fim de aula: anuncia a próxima e conta até emendar.
 *
 * Fica sobre o vídeo, e não no lugar dele, para que os controles continuem
 * alcançáveis — quem quiser rever o final não precisa cancelar antes.
 */
function ProximaAula({
  aula,
  segundos,
  aoAvancar,
  aoCancelar,
}: {
  aula: AulaDoModal;
  segundos: number;
  aoAvancar: () => void;
  aoCancelar: () => void;
}) {
  return (
    <div
      // `polite` anuncia uma vez, sem interromper a cada segundo que muda.
      aria-live="polite"
      className="animate-surgir absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-black/80 px-6 text-center backdrop-blur-sm sm:rounded-xl"
    >
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold tracking-wider text-white/60 uppercase">
          A seguir
        </p>
        <p className="font-display line-clamp-2 max-w-md text-lg font-semibold text-white sm:text-xl">
          {aula.titulo}
        </p>
      </div>

      {/*
        A contagem é o que se olha aqui: ela diz quanto tempo resta para
        decidir entre deixar emendar e cancelar. Como número corrido no meio da
        frase, ela se perdia — vira numeral grande, com o resto da frase abaixo.

        Em branco, e não no acento: o fundo desta camada é preto fixo, então um
        token do tema mudaria de legibilidade conforme o tema, e `acento-claro`
        no tema claro é azul escuro demais para este tamanho sobre preto.
      */}
      <div className="flex flex-col items-center gap-1">
        <span className="font-display text-6xl leading-none font-bold text-white tabular-nums sm:text-7xl">
          {segundos}
        </span>
        <p className="text-sm text-white/70">
          {segundos === 1 ? "segundo para começar" : "segundos para começar"}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={aoAvancar}
          className="bg-acento text-white inline-flex min-h-11 items-center gap-2 rounded-full px-6 text-sm font-bold transition-transform duration-150 active:scale-95"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4" fill="currentColor">
            <path d="M4 2.5v11l9-5.5-9-5.5Z" />
          </svg>
          Assistir agora
        </button>

        <button
          type="button"
          onClick={aoCancelar}
          className="inline-flex min-h-11 items-center rounded-full border border-white/30 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function BotaoFechar({ aoClicar }: { aoClicar: () => void }) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-label="Fechar"
      className="ease-suave flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-[background-color,transform] duration-150 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white active:scale-90"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    </button>
  );
}

/**
 * Agrupa mantendo a ordem original: aulas soltas primeiro, depois cada módulo
 * na sequência em que aparece. Módulos repetidos não são reordenados nem
 * fundidos fora de ordem — o que chega já vem na sequência de exibição.
 */
function agrupar(aulas: AulaDoModal[]) {
  const grupos: { modulo: string | null; aulas: AulaDoModal[] }[] = [];

  for (const aula of aulas) {
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.modulo === aula.modulo) ultimo.aulas.push(aula);
    else grupos.push({ modulo: aula.modulo, aulas: [aula] });
  }

  return grupos;
}
