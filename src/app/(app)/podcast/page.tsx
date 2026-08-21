import type { Metadata } from "next";
import {
  listarConteudos,
  mapaDeProgresso,
  situacaoDosEpisodios,
} from "@/lib/queries";
import { DESCRICAO_PODCAST } from "@/lib/nav";
import { PaginaPodcast } from "@/components/podcast/pagina";
import { pessoasDoEpisodio, separarTitulo } from "@/lib/podcast";
import { capaVertical, duracaoTotal } from "@/lib/format";

export const metadata: Metadata = { title: "Podcasts" };

/**
 * Tela do podcast, em `/podcast`.
 *
 * Não é uma listagem: é um reprodutor com playlist, sem cabeçalho, filtros ou
 * paginação — nada disso serve a um feed de episódios de ~20 min que se ouve
 * em sequência. Por isso ela não passa pela `ListagemConteudos`.
 *
 * Morava em `/tipo/podcast`, de quando todas as telas por tipo dividiam aquele
 * segmento. `/tipo/*` ficou só redirecionando o que já foi compartilhado.
 */
export default async function TelaPodcast({
  searchParams,
}: {
  searchParams: Promise<{
    /** Episódio que deve abrir tocando — ver `rotaDoEpisodio`. */
    episodio?: string;
  }>;
}) {
  const { episodio } = await searchParams;

  /*
   * A playlist recebe o acervo INTEIRO: quem está ouvindo passa de um episódio
   * ao seguinte, e paginar isso cortaria a fila no meio.
   */
  const [acervo, progresso] = await Promise.all([
    listarConteudos({ tipo: "PODCAST", limit: 200 }),
    mapaDeProgresso(),
  ]);

  /*
   * A situação de cada episódio (inclusive os TERMINADOS) não existe em lote —
   * ver `situacaoDosEpisodios`. Só é buscada aqui, na tela que a usa.
   */
  const situacao = await situacaoDosEpisodios(acervo.data.map((c) => c.id));

  return (
    <PaginaPodcast
      descricao={DESCRICAO_PODCAST}
      episodioInicial={Number(episodio) || null}
      episodios={acervo.data.map((conteudo) => {
        const { convidado, tema } = separarTitulo(conteudo.titulo);
        const dele = situacao.get(conteudo.id);

        return {
          conteudoId: conteudo.id,
          convidado,
          tema,
          capa: capaVertical(conteudo),
          duracao: duracaoTotal(conteudo),
          publicadoEm: conteudo.dataCriacao,
          descricao: conteudo.descricao,
          /*
           * Apresentador e convidados saem do cadastro, e não do título: o
           * título é texto de vitrine e, quando ele traz um nome, é tão
           * frequentemente o do apresentador quanto o do convidado.
           */
          ...pessoasDoEpisodio(conteudo),
          categoria: conteudo.categoria?.nome ?? null,
          /*
           * `mapaDeProgresso` é o resguardo: ele cobre o que está em andamento
           * mesmo quando o detalhe do episódio falha ou fica além do teto de
           * chamadas.
           */
          percentual: dele?.percentual ?? progresso.get(conteudo.id) ?? 0,
          concluido: dele?.concluido ?? false,
        };
      })}
    />
  );
}
