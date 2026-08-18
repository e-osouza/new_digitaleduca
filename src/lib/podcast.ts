/**
 * Separa "Convidado — Tema" nas duas partes.
 *
 * Os 18 podcasts do acervo seguem esse padrão de título (por exemplo,
 * "Alfredo Soares — Construindo Máquinas de Vendas"), e é o convidado que puxa
 * o clique. Sem a separação ele fica diluído numa linha só.
 *
 * O separador aparece cadastrado em três formas — travessão, hífen e traço
 * médio —, então todas são aceitas. Título fora do padrão volta inteiro como
 * `convidado`, sem tema: é melhor exibir o título original do que arriscar um
 * corte errado.
 */
export function separarTitulo(titulo: string): {
  convidado: string;
  tema: string | null;
} {
  const encontrado = titulo.match(/^(.{2,60}?)\s*[—–-]\s+(.*)$/);

  if (!encontrado) return { convidado: titulo.trim(), tema: null };

  const [, convidado, tema] = encontrado;
  return { convidado: convidado.trim(), tema: tema.trim() || null };
}

/** Parâmetro que manda a página do podcast já abrir tocando um episódio. */
export const PARAM_EPISODIO = "episodio";

/**
 * Destino de um podcast clicado em qualquer lugar da plataforma.
 *
 * Podcast não vai para a ficha do conteúdo como aula e palestra: ele abre na
 * própria tela do podcast, com o player e a playlist, já tocando o episódio
 * escolhido. Um episódio de ~20 min que se ouve em sequência não pede uma
 * página de apresentação no meio do caminho.
 *
 * A rota vive aqui porque quem a monta está espalhado — o card do catálogo, o
 * item do feed, os relacionados da ficha. Uma constante evita que um deles
 * fique para trás numa mudança.
 */
export function rotaDoEpisodio(conteudoId: number) {
  return `/tipo/podcast?${PARAM_EPISODIO}=${conteudoId}`;
}
