import type { Conteudo, ConteudoResumo, GratuitoTipo } from "@/types/api";

/** 2444 → "40 min" · 291 → "4 min" · 7200 → "2 h" · 5400 → "1 h 30 min" */
export function formatarDuracao(segundos: number | null | undefined): string {
  if (!segundos || segundos <= 0) return "";
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.round((segundos % 3600) / 60);
  if (horas === 0) return `${Math.max(minutos, 1)} min`;
  if (minutos === 0) return `${horas} h`;
  return `${horas} h ${minutos} min`;
}

/** Soma a duração de todos os vídeos de um conteúdo. */
export function duracaoTotal(conteudo: Pick<Conteudo, "videos" | "duracao">): number {
  if (typeof conteudo.duracao === "number" && conteudo.duracao > 0) {
    return conteudo.duracao;
  }
  return (conteudo.videos ?? []).reduce((soma, v) => soma + (v.duracao ?? 0), 0);
}

export function formatarPreco(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function formatarData(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

const ROTULOS_TIPO: Record<string, string> = {
  AULA: "Aula",
  PALESTRA: "Palestra",
  PODCAST: "Podcast",
};

export function rotuloTipo(tipo: string): string {
  return ROTULOS_TIPO[tipo] ?? tipo;
}

/**
 * O conteúdo está liberado sem assinatura?
 * `PERMANENTE` sempre; `TEMPORARIO` enquanto `gratuitoAte` não passou.
 */
export function estaLiberado(conteudo: {
  gratuitoTipo: GratuitoTipo;
  gratuitoAte: string | null;
}): boolean {
  if (conteudo.gratuitoTipo === "PERMANENTE") return true;
  if (conteudo.gratuitoTipo === "TEMPORARIO" && conteudo.gratuitoAte) {
    return new Date(conteudo.gratuitoAte).getTime() > Date.now();
  }
  return false;
}

/** `/videos/1156627423` → `1156627423` */
export function extrairVimeoId(caminho: string | null | undefined): string | null {
  if (!caminho) return null;
  const encontrado = caminho.match(/(\d{6,})/);
  return encontrado ? encontrado[1] : null;
}

/** Escolhe a melhor imagem disponível para um card. */
export function capaDoConteudo(
  conteudo: Pick<
    Conteudo | ConteudoResumo,
    "thumbnailDesktop" | "thumbnailMobile" | "thumbnailDestaque"
  >,
  preferirDestaque = false,
): string | null {
  if (preferirDestaque && conteudo.thumbnailDestaque) return conteudo.thumbnailDestaque;
  return conteudo.thumbnailDesktop ?? conteudo.thumbnailMobile ?? null;
}

/** Primeiros `limite` caracteres, cortando na palavra. */
export function resumir(texto: string | null, limite = 160): string {
  if (!texto) return "";
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= limite) return limpo;
  return `${limpo.slice(0, limpo.lastIndexOf(" ", limite))}…`;
}

/** Transforma um bloco de texto com quebras de linha numa lista de itens. */
export function emTopicos(texto: string | null): string[] {
  if (!texto) return [];
  return texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0);
}
