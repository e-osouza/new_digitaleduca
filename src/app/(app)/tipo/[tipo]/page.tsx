import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  listarConteudos,
  mapaDeProgresso,
  situacaoDosEpisodios,
} from "@/lib/queries";
import { DESCRICAO_PODCAST, ROTAS_ANTIGAS } from "@/lib/nav";
import { PaginaPodcast } from "@/components/podcast/pagina";
import { pessoasDoEpisodio, separarTitulo } from "@/lib/podcast";
import { capaVertical, duracaoTotal } from "@/lib/format";

export const metadata: Metadata = { title: "Podcasts" };

/**
 * Tela do podcast, em `/tipo/podcast`.
 *
 * Este segmento já reuniu todas as listagens por tipo. Aula e palestra saíram
 * para `/conteudo`, e aqui ficou o que nunca foi uma listagem: um reprodutor
 * com playlist, sem cabeçalho, filtros ou paginação — nada disso serve a um
 * feed de episódios de ~20 min que se ouve em sequência.
 *
 * Continua dinâmico só porque as rotas antigas (`/tipo/aula`,
 * `/tipo/palestra`, `/tipo/conteudo`) precisam ser atendidas para
 * redirecionar — links já compartilhados e favoritos passam por aqui.
 */
export default async function PaginaTipo({
  params,
  searchParams,
}: {
  params: Promise<{ tipo: string }>;
  searchParams: Promise<{
    /** Episódio que deve abrir tocando — ver `rotaDoEpisodio`. */
    episodio?: string;
  }>;
}) {
  const [{ tipo }, { episodio }] = await Promise.all([params, searchParams]);

  if (ROTAS_ANTIGAS.includes(tipo)) redirect("/conteudo");
  if (tipo !== "podcast") notFound();

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
