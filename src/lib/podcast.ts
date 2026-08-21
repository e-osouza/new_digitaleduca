import type { ConteudoInstrutor } from "@/types/api";

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
 * Podcast não vai para a ficha do conteúdo como MasterClass e curso: abre na
 * própria tela do podcast, com o player e a playlist, já tocando o episódio
 * escolhido. Um episódio de ~20 min que se ouve em sequência não pede uma
 * página de apresentação no meio do caminho.
 *
 * A rota vive aqui porque quem a monta está espalhado — o card do catálogo, o
 * item do feed, os relacionados da ficha. Uma constante evita que um deles
 * fique para trás numa mudança.
 */
export function rotaDoEpisodio(conteudoId: number) {
  return `/podcast?${PARAM_EPISODIO}=${conteudoId}`;
}

/**
 * Quem apresenta e quem participa de um episódio.
 *
 * As duas origens convivem porque o modelo mudou em 19/08/2026. O apresentador
 * hoje é texto puro em `conteudos.apresentador` — vários nomes separados por
 * vírgula —, e é ele que manda. Cadastros anteriores gravaram o apresentador
 * como um vínculo de `papel: "APRESENTADOR"`, que serve de recurso final
 * enquanto esses episódios não forem reeditados.
 *
 * Os convidados continuam sendo vínculos: são pessoas do acervo, com perfil
 * público. Quem vier sem papel, ou como `INSTRUTOR`, entra como participante —
 * num podcast a apresentação é o papel declarado, o resto é quem foi conversar.
 *
 * Nomes repetidos caem fora: o episódio 44 tem Rafael Liporace nas duas
 * origens, e sem isso ele apareceria duas vezes.
 */
export function pessoasDoEpisodio(conteudo: {
  apresentador?: string | null;
  instrutores?: ConteudoInstrutor[];
}) {
  const doVinculo: string[] = [];
  const participantes: string[] = [];
  const vistos = new Set<number>();

  for (const vinculo of conteudo.instrutores ?? []) {
    const pessoa = vinculo?.instrutor;
    if (!pessoa?.nome || vistos.has(pessoa.id)) continue;
    vistos.add(pessoa.id);

    (vinculo.papel === "APRESENTADOR" ? doVinculo : participantes).push(
      pessoa.nome.trim(),
    );
  }

  const doTexto = (conteudo.apresentador ?? "")
    .split(",")
    .map((nome) => nome.trim())
    .filter(Boolean);

  const apresentadores = doTexto.length > 0 ? doTexto : doVinculo;
  const chave = (nome: string) => nome.toLocaleLowerCase("pt-BR");
  const jaApresenta = new Set(apresentadores.map(chave));

  return {
    apresentadores,
    participantes: participantes.filter((nome) => !jaApresenta.has(chave(nome))),
  };
}
