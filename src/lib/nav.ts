import type { TipoConteudo } from "@/types/api";

export type ItemNav = {
  href: string;
  rotulo: string;
  /** Traçado do ícone, desenhado num viewBox 0 0 20 20. */
  icone: React.ReactNode;
};

export type GrupoNav = {
  titulo: string | null;
  itens: ItemNav[];
};

/**
 * Site institucional, que vive fora deste projeto.
 *
 * A landing saiu daqui quando os domínios se separaram: `digitaleduca.com.vc`
 * é o site, `plataforma.digitaleduca.com.vc` é este app. Toda ligação de volta
 * para conteúdo de marketing passa por esta constante — assim uma eventual
 * troca de domínio é um ponto só.
 */
export const SITE_INSTITUCIONAL = "https://digitaleduca.com.vc";

/**
 * Frase de apoio de cada listagem.
 *
 * Separada do rótulo porque muda por outro motivo: o rótulo é nome de produto
 * ("MasterClass"), a frase é promessa de conteúdo. Palestra segue no mapa
 * mesmo sem tela própria — o acervo dela foi migrado para MasterClass, mas o
 * tipo continua existindo no contrato e pode voltar a receber conteúdo.
 */
export const DESCRICOES_DE_TIPO: Record<TipoConteudo, string> = {
  CURSO: "Formações completas, em módulos, para você seguir do começo ao fim.",
  AULA: "Encontros com quem já escalou empresas — para aplicar no dia a dia do negócio.",
  PALESTRA: "Replays e apresentações do palco.",
  PODCAST: "Conversas com especialistas, para ouvir enquanto você faz outra coisa.",
};

export const DESCRICAO_PODCAST = DESCRICOES_DE_TIPO.PODCAST;

/**
 * Endereços que mudaram, e para onde levam hoje.
 *
 * Cada linha aqui é um link que alguém já compartilhou ou salvou nos
 * favoritos. `/tipo/*` foi a forma antiga de endereçar as listagens; hoje cada
 * uma tem caminho próprio e o segmento `/tipo` só existe para redirecionar.
 *
 * `aula`, `palestra` e `conteudo` caem em MasterClass: é para lá que o acervo
 * dos dois primeiros foi, e a listagem unificada de `/conteudo` mostrava
 * majoritariamente esse tipo.
 */
export const REDIRECIONAMENTOS: Record<string, string> = {
  aula: "/masterclass",
  palestra: "/masterclass",
  conteudo: "/masterclass",
  curso: "/cursos",
  cursos: "/cursos",
  masterclass: "/masterclass",
  podcast: "/podcast",
};

export const ROTULOS_PLURAIS: Record<TipoConteudo, string> = {
  AULA: "MasterClass",
  CURSO: "Cursos",
  PALESTRA: "Palestras",
  PODCAST: "Podcasts",
};
