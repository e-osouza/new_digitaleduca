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

/**
 * Formato de relógio, como no player: 758 → "12:38" · 3735 → "1:02:15".
 * Diferente de `formatarDuracao`, que arredonda para leitura em listagens.
 */
export function formatarRelogio(segundos: number | null | undefined): string {
  const total = Math.max(0, Math.floor(segundos ?? 0));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const resto = total % 60;

  const doisDigitos = (n: number) => String(n).padStart(2, "0");

  return horas > 0
    ? `${horas}:${doisDigitos(minutos)}:${doisDigitos(resto)}`
    : `${doisDigitos(minutos)}:${doisDigitos(resto)}`;
}

/**
 * Soma a duração das aulas, contando cada vídeo uma única vez.
 *
 * NÃO usamos o campo `duracao` que a API devolve: um vídeo que pertence a um
 * módulo aparece tanto em `videos[]` quanto em `modulos[].videos`, e o backend
 * soma os dois arrays (`duracaoDireta + duracaoModulos`). O resultado é o
 * dobro — em "Finanças Corporativas" o campo trazia 144m34s para 72m17s reais.
 */
export function duracaoTotal(
  conteudo: Partial<Pick<Conteudo, "videos" | "modulos" | "duracao">>,
): number {
  const todos = [
    ...(conteudo.videos ?? []),
    ...(conteudo.modulos ?? []).flatMap((modulo) => modulo.videos ?? []),
  ];

  const porId = new Map(todos.map((video) => [video.id, video.duracao ?? 0]));
  const soma = [...porId.values()].reduce((total, segundos) => total + segundos, 0);

  // Sem lista de vídeos (listagens reduzidas), resta confiar no campo da API.
  if (soma === 0 && typeof conteudo.duracao === "number") {
    return conteudo.duracao;
  }

  return soma;
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

/*
  O rótulo é apresentação; o valor é contrato. `AULA` virou "MasterClass" na
  tela em 20/08/2026 sem que o dado mudasse — o app mobile já publicado compara
  a string, e renomear o enum quebraria as versões instaladas.
*/
const ROTULOS_TIPO: Record<string, string> = {
  AULA: "MasterClass",
  CURSO: "Curso",
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

/**
 * Arte VERTICAL, usada nos cards. `thumbnailMobile` é a peça em retrato — no
 * acervo ela vem em 850×971 (proporção 7/8, quase quadrada), que é a razão de
 * o card usar `aspect-[7/8]`. A desktop entra só como reserva, e aí o recorte
 * do card a corta no centro.
 */
export function capaVertical(
  conteudo: Pick<
    Conteudo | ConteudoResumo,
    "thumbnailDesktop" | "thumbnailMobile"
  >,
): string | null {
  return conteudo.thumbnailMobile ?? conteudo.thumbnailDesktop ?? null;
}

/** Arte horizontal — heróis e capas de topo. */
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
