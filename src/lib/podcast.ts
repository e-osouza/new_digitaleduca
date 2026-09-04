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

/** Lista separada por vírgula, como a API grava apresentador e convidados. */
function nomesDoTexto(campo: string | null | undefined) {
  return (campo ?? "")
    .split(",")
    .map((nome) => nome.trim())
    .filter(Boolean);
}

/**
 * Quem apresenta e quem foi convidado num episódio.
 *
 * Os DOIS papéis são texto puro no conteúdo — `conteudos.apresentador` e
 * `conteudos.convidados`, nomes separados por vírgula —, e é o texto que
 * manda. O vínculo com Instrutor ficou como recurso final: os cadastros
 * antigos gravavam as pessoas assim, e 21 dos 24 episódios ainda têm o vínculo
 * repetindo o que o texto já diz.
 *
 * O apresentador saiu do vínculo em 19/08/2026 e o convidado veio depois, no
 * mesmo formato. Quem vier sem papel, ou como `INSTRUTOR`, é lido como
 * convidado — num podcast a apresentação é o papel declarado; o resto é quem
 * foi conversar.
 *
 * Nomes repetidos caem fora: há episódio com a mesma pessoa nas duas origens,
 * e sem isso ela apareceria duas vezes.
 */
export function pessoasDoEpisodio(conteudo: {
  apresentador?: string | null;
  convidados?: string | null;
  instrutores?: ConteudoInstrutor[];
}) {
  const apresentaNoVinculo: string[] = [];
  const convidaNoVinculo: string[] = [];
  const vistos = new Set<number>();

  for (const vinculo of conteudo.instrutores ?? []) {
    const pessoa = vinculo?.instrutor;
    if (!pessoa?.nome || vistos.has(pessoa.id)) continue;
    vistos.add(pessoa.id);

    (vinculo.papel === "APRESENTADOR"
      ? apresentaNoVinculo
      : convidaNoVinculo
    ).push(pessoa.nome.trim());
  }

  const apresentadoresDoTexto = nomesDoTexto(conteudo.apresentador);
  const convidadosDoTexto = nomesDoTexto(conteudo.convidados);

  const apresentadores =
    apresentadoresDoTexto.length > 0
      ? apresentadoresDoTexto
      : apresentaNoVinculo;
  const convidados =
    convidadosDoTexto.length > 0 ? convidadosDoTexto : convidaNoVinculo;

  const chave = (nome: string) => nome.toLocaleLowerCase("pt-BR");
  const jaApresenta = new Set(apresentadores.map(chave));

  return {
    apresentadores,
    convidados: convidados.filter((nome) => !jaApresenta.has(chave(nome))),
  };
}
