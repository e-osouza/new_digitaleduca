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

/** Rotas de listagem por tipo: /tipo/aula, /tipo/palestra, /tipo/podcast. */
export const TIPOS_NA_URL: Record<string, TipoConteudo> = {
  aula: "AULA",
  palestra: "PALESTRA",
  podcast: "PODCAST",
};

export const ROTULOS_PLURAIS: Record<TipoConteudo, string> = {
  AULA: "Aulas",
  PALESTRA: "Palestras",
  PODCAST: "Podcasts",
};
