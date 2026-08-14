"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import type { AulaDoModal } from "@/components/modal-player";

/*
 * Mesmo motivo da página do conteúdo: o player é o maior pedaço de JS da
 * página e a maioria das visitas à trilha só confere o progresso. O chunk desce
 * quando o ponteiro encosta num item da jornada, não no carregamento.
 */
const ModalPlayer = dynamic(
  () => import("@/components/modal-player").then((m) => m.ModalPlayer),
  { ssr: false },
);

type Comandos = {
  /** Abre a aula pedida. */
  abrir: (videoId: number) => void;
  /** Só baixa o player, sem abrir — usado na aproximação do ponteiro. */
  preparar: () => void;
};

/**
 * `null` fora do provedor — é o que permite ao gatilho degradar para um botão
 * inerte se alguém o usar fora da página da trilha.
 */
const Contexto = createContext<Comandos | null>(null);

/**
 * Reprodução da trilha no mesmo modal usado nas páginas de conteúdo.
 *
 * O modal é único e vive aqui; os itens da jornada e o botão do cabeçalho só
 * pedem a abertura pelo contexto. Renderizar um `<dialog>` por aula duplicaria
 * a lista lateral inteira em cada linha da página.
 *
 * O conteúdo da página continua sendo renderizado no servidor e chega como
 * `children` — este componente não puxa nada disso para o cliente.
 */
export function ReprodutorTrilha({
  aulas,
  trilhaId,
  inicialId,
  children,
}: {
  aulas: AulaDoModal[];
  trilhaId: number;
  /** Aula em que o modal abre quando ninguém escolhe uma — a próxima da trilha. */
  inicialId: number;
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const [atualId, setAtualId] = useState(inicialId);
  /* Uma vez montado, fica: ver a nota em `botao-assistir`. */
  const [montado, setMontado] = useState(false);

  const preparar = useCallback(() => setMontado(true), []);

  const abrir = useCallback((videoId: number) => {
    setAtualId(videoId);
    setMontado(true);
    setAberto(true);
  }, []);

  const comandos = useMemo(() => ({ abrir, preparar }), [abrir, preparar]);

  return (
    <Contexto.Provider value={comandos}>
      {children}

      {montado && aulas.length > 0 && (
        /*
         * `key` remonta o modal quando a aula escolhida muda: `inicialId` é só o
         * valor inicial do estado interno dele, então sem isto a segunda
         * abertura cairia na aula da primeira.
         */
        <ModalPlayer
          key={atualId}
          aberto={aberto}
          aoFechar={() => setAberto(false)}
          aulas={aulas}
          inicialId={atualId}
          trilhaId={trilhaId}
        />
      )}
    </Contexto.Provider>
  );
}

/**
 * Envolve o cartão da aula (ou o botão do cabeçalho) e abre o player no lugar
 * de navegar. Recebe a aparência pronta como `children`, para que a marcação
 * continue no componente de servidor da página.
 */
export function GatilhoAula({
  videoId,
  className,
  children,
}: {
  /** ID do vídeo — é o que identifica a aula dentro do modal. */
  videoId: number;
  className?: string;
  children: ReactNode;
}) {
  const comandos = useContext(Contexto);

  return (
    <button
      type="button"
      onClick={() => comandos?.abrir(videoId)}
      // Baixa o player na aproximação, para o clique não esperar o chunk.
      onPointerEnter={() => comandos?.preparar()}
      onFocus={() => comandos?.preparar()}
      className={className}
    >
      {children}
    </button>
  );
}
