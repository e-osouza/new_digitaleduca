import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api";
import { encerrarSessaoExpirada } from "@/lib/sessao-expirada";
import {
  listarConteudos,
  listarSelecionados,
  obterConteudo,
  recomendados,
} from "@/lib/queries";
import {
  capaDoConteudo,
  duracaoTotal,
  emTopicos,
  estaLiberado,
  formatarData,
  formatarDuracao,
  resumir,
  rotuloTipo,
} from "@/lib/format";
import { CardConteudo } from "@/components/card-conteudo";
import { Trilho } from "@/components/trilho";
import { Selo } from "@/components/selo";
import { SemAcesso } from "@/components/sem-acesso";
import { BotaoSalvar } from "@/components/botao-salvar";
import type { Conteudo, Envelope, Video } from "@/types/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const conteudo = await obterConteudo(Number(id));
    return {
      title: conteudo.titulo,
      description: resumir(conteudo.descricao, 155),
    };
  } catch {
    return { title: "Conteúdo" };
  }
}

export default async function PaginaConteudo({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  let conteudo: Conteudo;
  try {
    conteudo = await obterConteudo(numero);
  } catch (erro) {
    if (erro instanceof ApiError) {
      if (erro.naoAutenticado) encerrarSessaoExpirada(`/conteudo/${numero}`);
      if (erro.naoEncontrado) notFound();
      if (erro.semAssinatura) return <SemAcesso />;
    }
    throw erro;
  }

  const capa = conteudo.thumbnailDestaque ?? capaDoConteudo(conteudo);
  const duracao = duracaoTotal(conteudo);
  const liberado = estaLiberado(conteudo);
  const aulas = listarAulas(conteudo);
  const primeiraAula = aulas[0];
  const aprendizagem = emTopicos(conteudo.aprendizagem);
  const [relacionados, selecionados] = await Promise.all([
    comCapaHorizontal(normalizarRecomendados(await recomendados(numero, 12))),
    listarSelecionados(),
  ]);

  // O id do vínculo é o que a API usa para remover da lista.
  const vinculoNaLista =
    selecionados.find((item) => item.conteudo?.id === numero)?.id ?? null;

  return (
    <div className="flex flex-col gap-10 pb-8 sm:gap-14">
      {/* ---- capa ---- */}
      <section className="relative min-h-[300px] overflow-hidden sm:min-h-[380px] lg:min-h-[440px]">
        {capa && (
          <Image
            src={capa}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        )}
        <div className="veu-heroi absolute inset-0" />

        <div className="calha relative flex w-full flex-col justify-end gap-4 pt-20 pb-8 sm:gap-5 sm:pt-24 sm:pb-10">
          <div className="flex flex-wrap items-center gap-2">
            <Selo variacao="acento">{rotuloTipo(conteudo.tipo)}</Selo>
            {conteudo.level && <Selo>{conteudo.level}</Selo>}
            {duracao > 0 && <Selo>{formatarDuracao(duracao)}</Selo>}
            {liberado && <Selo variacao="gratis">Grátis</Selo>}
            {aulas.length > 1 && <Selo>{aulas.length} aulas</Selo>}
          </div>

          <h1 className="font-display max-w-3xl text-3xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-4xl">
            {conteudo.titulo}
          </h1>

          {conteudo.instrutores.length > 0 && (
            <p className="text-texto-3 text-sm">
              com{" "}
              <span className="text-texto-2 font-medium">
                {conteudo.instrutores.map((i) => i.instrutor.nome).join(", ")}
              </span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {primeiraAula && (
              <Link
                href={`/assistir/${conteudo.id}?aula=${primeiraAula.id}`}
                className="bg-acento text-fundo hover:bg-acento-hover inline-flex min-h-11 items-center gap-2 rounded-full px-6 text-sm font-bold transition-colors"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4" fill="currentColor">
                  <path d="M4 2.5v11l9-5.5-9-5.5Z" />
                </svg>
                {aulas.length > 1 ? "Começar a primeira aula" : "Assistir"}
              </Link>
            )}

            <BotaoSalvar conteudoId={conteudo.id} selecionadoId={vinculoNaLista} />
          </div>
        </div>
      </section>

      {/* ---- corpo ---- */}
      <div className="calha grid w-full gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
        <div className="flex flex-col gap-8 sm:gap-10">
          {conteudo.descricao && (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-xl font-semibold">Sobre</h2>
              <p className="text-texto-2 leading-relaxed whitespace-pre-line">
                {conteudo.descricao}
              </p>
            </section>
          )}

          {aprendizagem.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-xl font-semibold">
                O que você vai aprender
              </h2>
              <ul className="flex flex-col gap-2.5">
                {aprendizagem.map((item, indice) => (
                  <li key={indice} className="text-texto-2 flex gap-3 text-sm leading-relaxed">
                    <span aria-hidden="true" className="text-acento mt-0.5 shrink-0">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {aulas.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-xl font-semibold">Conteúdo</h2>
              <ol className="border-borda-suave divide-borda-suave bg-superficie divide-y overflow-hidden rounded-xl border">
                {aulas.map((aula, indice) => (
                  <li key={aula.id}>
                    <Link
                      href={`/assistir/${conteudo.id}?aula=${aula.id}`}
                      className="hover:bg-superficie-2 active:bg-borda-suave group flex min-h-14 items-center gap-3 px-4 py-3.5 transition-colors duration-200 sm:gap-4"
                    >
                      <span className="text-texto-3 w-6 shrink-0 text-sm font-semibold tabular-nums">
                        {String(indice + 1).padStart(2, "0")}
                      </span>
                      <span className="text-texto flex-1 text-sm leading-snug font-medium">
                        {aula.titulo}
                      </span>
                      {aula.duracao ? (
                        <span className="text-texto-3 shrink-0 text-xs tabular-nums">
                          {formatarDuracao(aula.duracao)}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* ---- lateral ---- */}
        <aside className="flex flex-col gap-8">
          {conteudo.instrutores.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="font-display text-lg font-semibold">
                {conteudo.instrutores.length > 1 ? "Instrutores" : "Instrutor"}
              </h2>
              {conteudo.instrutores.map(({ instrutor }) => (
                <Link
                  key={instrutor.id}
                  href={`/instrutor/${instrutor.id}`}
                  className="border-borda-suave bg-superficie hover:border-acento/60 ease-suave flex gap-3 rounded-xl border p-4 transition-[border-color,transform] duration-200 active:scale-[0.99]"
                >
                  <div className="bg-superficie-2 relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                    {instrutor.avatar ? (
                      <Image
                        src={instrutor.avatar}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-texto-3 flex h-full items-center justify-center font-semibold">
                        {instrutor.nome.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold">{instrutor.nome}</p>
                    {instrutor.formacao && (
                      <p className="text-texto-3 text-xs leading-snug">
                        {instrutor.formacao}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </section>
          )}

          <section className="border-borda-suave bg-superficie flex flex-col gap-3 rounded-xl border p-5">
            <h2 className="text-texto-2 text-xs font-semibold tracking-wider uppercase">
              Detalhes
            </h2>
            <dl className="flex flex-col gap-2.5 text-sm">
              {conteudo.categoria && (
                <div className="flex flex-col gap-0.5">
                  <dt className="text-texto-3 text-xs">Categoria</dt>
                  <dd>
                    <Link
                      href={`/categoria/${conteudo.categoria.id}`}
                      className="text-acento hover:text-acento-hover font-medium"
                    >
                      {conteudo.categoria.nome}
                    </Link>
                  </dd>
                </div>
              )}
              <Detalhe termo="Subcategoria" valor={conteudo.subcategoria?.nome} />
              <Detalhe termo="Nível" valor={conteudo.level} />
              <Detalhe
                termo="Duração"
                valor={duracao > 0 ? formatarDuracao(duracao) : null}
              />
              <Detalhe
                termo="Publicado"
                valor={conteudo.dataCriacao ? formatarData(conteudo.dataCriacao) : null}
              />
              <Detalhe termo="Pré-requisitos" valor={conteudo.requisitos} />
            </dl>
          </section>
        </aside>
      </div>

      {relacionados.length > 0 && (
        <Trilho titulo="Relacionados" descricao="Continue por aqui">
          {relacionados.map((item) => (
            <CardConteudo key={item.id} conteudo={item} />
          ))}
        </Trilho>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Detalhe({ termo, valor }: { termo: string; valor?: string | null }) {
  if (!valor) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-texto-3 text-xs">{termo}</dt>
      <dd className="text-texto-2">{valor}</dd>
    </div>
  );
}

/** Vídeos soltos + vídeos dentro de módulos, na ordem de exibição. */
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

/**
 * `findRecomendados` no backend seleciona só `thumbnailMobile` — a arte
 * vertical. Num card 16:9 ela chega recortada e desalinhada do resto da
 * interface, então completamos com a capa horizontal vinda da listagem
 * pública, que é cacheada e já usada em outras telas.
 */
async function comCapaHorizontal(itens: Conteudo[]): Promise<Conteudo[]> {
  const faltando = itens.some((item) => !item.thumbnailDesktop);
  if (itens.length === 0 || !faltando) return itens;

  const catalogo = await listarConteudos({ limit: 200 }).catch(() => null);
  if (!catalogo) return itens;

  const capas = new Map(
    catalogo.data.map((c) => [c.id, c.thumbnailDesktop] as const),
  );

  return itens.map((item) =>
    item.thumbnailDesktop
      ? item
      : { ...item, thumbnailDesktop: capas.get(item.id) ?? null },
  );
}

/** O endpoint de recomendados ora devolve array puro, ora `{data}`. */
function normalizarRecomendados(
  resposta: Conteudo[] | Envelope<Conteudo> | null,
): Conteudo[] {
  if (!resposta) return [];
  if (Array.isArray(resposta)) return resposta;
  return resposta.data ?? [];
}
