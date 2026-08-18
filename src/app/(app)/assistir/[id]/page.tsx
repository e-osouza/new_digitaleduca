import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api";
import { encerrarSessaoExpirada } from "@/lib/sessao-expirada";
import {
  mediaDoVideo,
  minhaAvaliacao,
  obterConteudo,
  progressoDoVideo,
} from "@/lib/queries";
import { extrairVimeoId, formatarDuracao, rotuloTipo } from "@/lib/format";
import { Player } from "@/components/player";
import { SemAcesso } from "@/components/sem-acesso";
import { Selo } from "@/components/selo";
import { Avaliacao } from "@/components/avaliacao";
import type { Conteudo, Video } from "@/types/api";

export const metadata: Metadata = { title: "Assistindo" };

export default async function Assistir({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aula?: string; lista?: string; item?: string }>;
}) {
  const [{ id }, { aula, lista, item }] = await Promise.all([
    params,
    searchParams,
  ]);

  /*
   * Contexto opcional de lista. Quando a aula é aberta por dentro de uma
   * lista, o player precisa avisar também o endpoint dela — o backend mantém
   * os dois progressos separados.
   */
  const listaId = Number.isInteger(Number(lista)) ? Number(lista) : null;
  const listaItemId = Number.isInteger(Number(item)) ? Number(item) : null;

  const conteudoId = Number(id);
  if (!Number.isInteger(conteudoId) || conteudoId <= 0) notFound();

  let conteudo: Conteudo;
  try {
    conteudo = await obterConteudo(conteudoId);
  } catch (erro) {
    if (erro instanceof ApiError) {
      if (erro.naoAutenticado) encerrarSessaoExpirada(`/assistir/${conteudoId}`);
      if (erro.naoEncontrado) notFound();
      /*
       * O gatilho é a recusa DA API, não um teste de assinatura aqui no front.
       * `GET /usuario/me` não devolve a `role`, então um usuário CORTESIA
       * aparece como se não tivesse assinatura — barrá-lo pelo dado local
       * bloquearia quem tem acesso liberado. Quem autoriza é sempre a API.
       */
      if (erro.semAssinatura) {
        return <SemAcesso conteudoId={conteudoId} />;
      }
    }
    throw erro;
  }

  const aulas = listarAulas(conteudo);
  const selecionadaId = Number(aula);
  const atual = aulas.find((v) => v.id === selecionadaId) ?? aulaParaRetomar(aulas);

  if (!atual) {
    return (
      <Vazio
        conteudoId={conteudoId}
        mensagem="Este conteúdo ainda não tem vídeos publicados."
      />
    );
  }

  /*
   * O ID do Vimeo sai do próprio vídeo: `GET /conteudos/{id}` já traz `url`.
   *
   * Antes eu buscava em `GET /video/{id}` e, na falha, caía no
   * `videoIntrodutorio` do conteúdo — que é OUTRO vídeo. Como a API resolve o
   * link procurando o ID na tabela `videos`, o intro não era encontrado e
   * voltava 404, exibido no player como "exige assinatura ativa".
   */
  const vimeoId = extrairVimeoId(atual.url);

  if (!vimeoId) {
    return (
      <Vazio
        conteudoId={conteudoId}
        mensagem="Esta aula ainda não tem um vídeo vinculado. Tente outra aula ou volte mais tarde."
      />
    );
  }

  const indiceAtual = aulas.findIndex((v) => v.id === atual.id);
  const proxima = aulas[indiceAtual + 1] ?? null;

  /*
   * A coluna lateral só existe quando há mais de uma aula. Sem esta condição
   * o grid reservava os 340px mesmo vazio, estreitando o player à toa.
   */
  const temLista = aulas.length > 1;

  const [media, minhaNota, progressoSalvo] = await Promise.all([
    mediaDoVideo(atual.id),
    minhaAvaliacao(atual.id),
    progressoDoVideo(atual.id),
  ]);

  /*
   * O detalhe do conteúdo já traz `ProgressoVideo` filtrado para o usuário,
   * mas depender só dele deixava o player recomeçar do zero quando a relação
   * não vinha. O endpoint dedicado é a fonte autoritativa; a relação embutida
   * fica como reserva.
   *
   * Vídeo concluído recomeça do início: retomar em 99% só faria a pessoa ver
   * os créditos de novo.
   */
  const salvo = progressoSalvo ?? atual.ProgressoVideo?.[0] ?? null;
  const segundosIniciais = salvo && !salvo.concluido ? salvo.segundos : 0;

  return (
    <div
      className={`grid w-full gap-6 px-0 pb-8 sm:gap-8 sm:px-8 sm:py-8 lg:px-10 ${
        temLista ? "lg:grid-cols-[minmax(0,1fr)_340px]" : "lg:grid-cols-1"
      }`}
    >
      <div className="flex flex-col gap-4 sm:gap-5">
        {/*
          No celular o player encosta nas bordas e gruda no topo enquanto a
          descrição e a lista de aulas rolam por baixo.
        */}
        <div className="bg-fundo sticky top-0 z-30 sm:static">
          <Player
            key={atual.id}
            vimeoId={vimeoId}
            videoId={atual.id}
            segundosIniciais={segundosIniciais}
            titulo={atual.titulo}
            listaId={listaId}
            listaItemId={listaItemId}
          />
        </div>

        <div className="flex flex-col gap-3 px-4 sm:px-0">
          <div className="flex flex-wrap items-center gap-2">
            <Selo variacao="acento">{rotuloTipo(conteudo.tipo)}</Selo>
            {atual.duracao ? <Selo>{formatarDuracao(atual.duracao)}</Selo> : null}
            {aulas.length > 1 && (
              <Selo>
                Aula {indiceAtual + 1} de {aulas.length}
              </Selo>
            )}
          </div>

          <h1 className="font-display text-2xl leading-tight font-semibold tracking-tight text-balance">
            {atual.titulo}
          </h1>

          <Link
            href={listaId ? `/listas/${listaId}` : `/conteudo/${conteudo.id}`}
            className="text-texto-3 hover:text-acento w-fit text-sm transition-colors"
          >
            ← {listaId ? "Voltar para a lista" : conteudo.titulo}
          </Link>

          <div className="border-borda-suave mt-1 border-t pt-4">
            <Avaliacao
              videoId={atual.id}
              notaInicial={minhaNota?.nota ?? null}
              media={media?.media ?? 0}
              total={media?.total ?? 0}
            />
          </div>

          {proxima && !listaId && (
            <Link
              href={`/assistir/${conteudo.id}?aula=${proxima.id}`}
              className="border-borda bg-superficie hover:border-acento/60 hover:bg-superficie-2 mt-2 flex w-fit items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              Próxima aula →
            </Link>
          )}
        </div>
      </div>

      {temLista && (
        <aside className="flex flex-col gap-3 px-4 sm:px-0 lg:sticky lg:top-0 lg:max-h-[calc(100dvh-4rem)]">
          <h2 className="text-texto-2 text-xs font-semibold tracking-wider uppercase">
            Nesta série
          </h2>
          <ol className="border-borda-suave divide-borda-suave divide-y overflow-y-auto rounded-xl border lg:min-h-0 lg:flex-1">
            {aulas.map((item, indice) => {
              const ativa = item.id === atual.id;
              return (
                <li key={item.id}>
                  <Link
                    href={`/assistir/${conteudo.id}?aula=${item.id}`}
                    aria-current={ativa ? "true" : undefined}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      ativa ? "bg-superficie" : "hover:bg-superficie/60"
                    }`}
                  >
                    <span
                      className={`w-6 shrink-0 text-xs font-semibold tabular-nums ${
                        ativa ? "text-acento" : "text-texto-3"
                      }`}
                    >
                      {String(indice + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`flex-1 text-sm leading-snug ${
                        ativa ? "text-texto font-semibold" : "text-texto-2"
                      }`}
                    >
                      {item.titulo}
                    </span>
                    {item.duracao ? (
                      <span className="text-texto-3 shrink-0 text-xs tabular-nums">
                        {formatarDuracao(item.duracao)}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ol>
        </aside>
      )}
    </div>
  );
}

function Vazio({
  conteudoId,
  mensagem,
}: {
  conteudoId: number;
  mensagem: string;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-semibold">Nada para reproduzir</h1>
      <p className="text-texto-3 text-sm">{mensagem}</p>
      <Link
        href={`/conteudo/${conteudoId}`}
        className="border-borda bg-superficie hover:border-acento/60 hover:bg-superficie-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
      >
        Voltar ao conteúdo
      </Link>
    </div>
  );
}

/**
 * Aula exibida quando a URL não indica nenhuma — o caso de quem chega pelo
 * "Continuar assistindo".
 *
 * A ordem de preferência é: a aula começada e não terminada, depois a primeira
 * ainda não concluída (quem terminou a 1 quer a 2), e só então a primeira da
 * lista. `ProgressoVideo` já vem filtrado para o usuário logado dentro de
 * `GET /conteudos/{id}`, então isto não custa nenhuma chamada extra.
 */
function aulaParaRetomar(aulas: Video[]): Video | null {
  const comecada = aulas.find((video) => {
    const progresso = video.ProgressoVideo?.[0];
    return progresso && progresso.segundos > 0 && !progresso.concluido;
  });
  if (comecada) return comecada;

  const pendente = aulas.find((video) => !video.ProgressoVideo?.[0]?.concluido);
  return pendente ?? aulas[0] ?? null;
}

function listarAulas(conteudo: Conteudo): Video[] {
  const dosModulos = (conteudo.modulos ?? []).flatMap((m) => m.videos ?? []);
  const soltos = conteudo.videos ?? [];
  const vistos = new Set<number>();

  return [...soltos, ...dosModulos].filter((video) => {
    if (vistos.has(video.id)) return false;
    vistos.add(video.id);
    return true;
  });
}
