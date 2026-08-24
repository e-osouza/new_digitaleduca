"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import dynamic from "next/dynamic";
import type { AulaDoModal } from "@/components/modal-player";

/*
 * O player (com os controles e a lista de aulas) é o maior pedaço de
 * JavaScript da página do conteúdo, e a maioria das visitas nunca o abre — dá
 * para ler a ficha, ver o elenco de aulas e sair. Carregá-lo sob demanda tira
 * esse peso do primeiro carregamento.
 *
 * `ssr: false` porque não há o que renderizar no servidor: o modal nasce
 * fechado e o `<dialog>` só existe depois do clique.
 */
const ModalPlayer = dynamic(
  () => import("@/components/modal-player").then((m) => m.ModalPlayer),
  { ssr: false },
);

/**
 * Dono do player da página do conteúdo.
 *
 * Existe porque DOIS lugares abrem o mesmo vídeo: o botão "Assistir agora" e
 * cada linha da lista de aulas. Antes o modal pertencia ao botão, e a lista
 * não tinha como alcançá-lo — por isso ela navegava para `/assistir`, tirando
 * a pessoa da página só para trocar de aula dentro do mesmo conteúdo.
 *
 * Com o modal aqui, os dois chamam `abrirAula(id)` e o vídeo sobe por cima da
 * ficha, já na aula pedida. Fechar devolve a pessoa exatamente onde ela
 * estava, com a descrição e a lista à vista.
 */
type Contexto = {
  /** Abre o player na aula informada. */
  abrirAula: (aulaId: number) => void;
  /**
   * Monta o player sem abri-lo, para o chunk baixar antes do clique. Ligado ao
   * ponteiro e ao foco de quem vai acionar.
   */
  prepararPlayer: () => void;
  /** Aulas que o player conhece — a lista usa para saber o que é clicável. */
  aulas: AulaDoModal[];
};

const ContextoPlayer = createContext<Contexto | null>(null);

/**
 * `null` quando não há player na página — conteúdo sem vídeo, ou visitante sem
 * acesso. Quem consome decide o que fazer: a lista de aulas, por exemplo,
 * volta a ser um link comum para `/assistir`.
 */
export function usePlayerConteudo() {
  return useContext(ContextoPlayer);
}

export function ProvedorPlayerConteudo({
  aulas,
  inicialId,
  abrirAoCarregar = false,
  children,
}: {
  aulas: AulaDoModal[];
  /** Aula em que o player abre quando ninguém pede uma específica. */
  inicialId: number;
  /**
   * Abre já na primeira renderização. É o que faz os cards de "continuar
   * assistindo" caírem direto no vídeo: eles apontam para a página do conteúdo
   * com `?assistir=1`, e ao fechar a pessoa já está nela.
   */
  abrirAoCarregar?: boolean;
  children: React.ReactNode;
}) {
  /*
   * Estado inicial, e não um efeito: assim o modal já nasce aberto, sem o
   * quadro intermediário em que a página aparece atrás antes de ele subir.
   */
  const [aberto, setAberto] = useState(abrirAoCarregar);
  /*
   * Uma vez montado, o modal fica. Desmontá-lo ao fechar cortaria a animação
   * de saída do `<dialog>` e faria a próxima abertura buscar o chunk de novo.
   */
  const [montado, setMontado] = useState(abrirAoCarregar);
  /*
   * Muda a cada abertura, e é o que reinicia o player na aula pedida: o
   * `ModalPlayer` guarda a aula atual em estado próprio, então trocar só o
   * `inicialId` não bastaria depois da primeira montagem. A chave força uma
   * instância nova — barata, porque só acontece ao abrir.
   */
  const [aulaAlvo, setAulaAlvo] = useState(inicialId);

  const router = useRouter();
  const caminho = usePathname();

  const abrirAula = useCallback((aulaId: number) => {
    setAulaAlvo(aulaId);
    setMontado(true);
    setAberto(true);
  }, []);

  const prepararPlayer = useCallback(() => setMontado(true), []);

  /*
   * Tira o `?assistir=1` da barra de endereços assim que o player abre. Sem
   * isso, recarregar a página ou voltar no histórico reabriria o vídeo, e a
   * URL guardada nos favoritos nunca mostraria a ficha do conteúdo.
   */
  useEffect(() => {
    if (abrirAoCarregar) router.replace(caminho, { scroll: false });
  }, [abrirAoCarregar, router, caminho]);

  return (
    <ContextoPlayer.Provider value={{ abrirAula, prepararPlayer, aulas }}>
      {children}

      {montado && (
        <ModalPlayer
          key={aulaAlvo}
          aberto={aberto}
          aoFechar={() => setAberto(false)}
          aulas={aulas}
          inicialId={aulaAlvo}
        />
      )}
    </ContextoPlayer.Provider>
  );
}
