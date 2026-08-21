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
 * Tipos que a listagem de `/conteudo` reúne.
 *
 * MasterClass, curso e palestra dividem a mesma página: das três o acervo
 * espera a mesma coisa — sentar e assistir —, e separá-las obrigava a pessoa a adivinhar em
 * qual das duas listas estava o que ela procurava. O selo no card continua
 * dizendo qual é qual. Podcast fica de fora porque não é uma listagem: é um
 * reprodutor com playlist, uma tela inteiramente outra.
 */
export const TIPOS_DE_CONTEUDO: TipoConteudo[] = [
  "AULA",
  "CURSO",
  "PALESTRA",
];

export const DESCRICAO_CONTEUDO =
  "Cursos, super aulas e replays de quem já escalou empresas — para aplicar no dia a dia do negócio.";

export const DESCRICAO_PODCAST =
  "Conversas com especialistas, para ouvir enquanto você faz outra coisa.";

/**
 * Segmentos de `/tipo/{...}` que hoje levam a `/conteudo`.
 *
 * `aula` e `palestra` são de quando cada tipo tinha a sua página; `conteudo`
 * é da versão em que a listagem unificada ainda morava sob `/tipo`. Todas
 * continuam respondendo por causa de links já compartilhados e do que ficou
 * salvo nos favoritos.
 */
export const ROTAS_ANTIGAS = ["aula", "palestra", "conteudo"];

export const ROTULOS_PLURAIS: Record<TipoConteudo, string> = {
  AULA: "MasterClasses",
  CURSO: "Cursos",
  PALESTRA: "Palestras",
  PODCAST: "Podcasts",
};
