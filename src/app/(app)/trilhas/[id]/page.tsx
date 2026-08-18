import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obterTrilha } from "@/lib/queries";
import { rotuloTipo } from "@/lib/format";
import { FAIXA } from "@/lib/ui";
import { Selo } from "@/components/selo";
import type { ConteudoDaTrilha, TrilhaDetalhe } from "@/types/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const trilha = await obterTrilha(Number(id));
  return { title: trilha?.titulo ?? "Trilha" };
}

/** Capa da trilha: destaque → desktop → mobile. */
function capaTrilha(trilha: TrilhaDetalhe) {
  return (
    trilha.thumbnailDestaque ??
    trilha.thumbnailDesktop ??
    trilha.thumbnailMobile
  );
}

export default async function PaginaTrilha({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const trilha = await obterTrilha(numero);
  if (!trilha) notFound();

  const conteudos = trilha.conteudos ?? [];
  const capa = capaTrilha(trilha);

  return (
    <div className={`${FAIXA} flex flex-col gap-10 py-8 sm:py-10`}>
      <Link
        href="/trilhas"
        className="text-texto-3 hover:text-acento flex w-fit items-center gap-1.5 text-sm transition-colors"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4.5 6.5 10l5.5 5.5" />
        </svg>
        Trilhas
      </Link>

      <header className="border-borda-suave bg-superficie flex flex-col gap-6 rounded-2xl border p-5 sm:p-6 lg:flex-row lg:items-start lg:gap-8">
        {capa && (
          <div className="bg-superficie-2 relative aspect-video w-full shrink-0 overflow-hidden rounded-xl lg:w-72">
            <Image
              src={capa}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 288px"
              className="object-cover"
            />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Selo variacao="acento">Formação</Selo>
            {trilha.nivel && <Selo variacao="neutro">{trilha.nivel}</Selo>}
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="font-display text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
              {trilha.titulo}
            </h1>
            {trilha.descricao && (
              <p className="text-texto-2 leading-relaxed">{trilha.descricao}</p>
            )}
          </div>

          <span className="text-texto-3 text-sm font-medium tabular-nums">
            {conteudos.length}{" "}
            {conteudos.length === 1 ? "conteúdo" : "conteúdos"} nesta trilha
          </span>
        </div>
      </header>

      {conteudos.length > 0 && (
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-lg font-semibold">
              Conteúdos da trilha
            </h2>
            <p className="text-texto-3 text-sm">
              Percorra na ordem sugerida — cada conteúdo prepara o seguinte.
            </p>
          </div>

          <ol className="flex flex-col gap-3">
            {conteudos.map((conteudo, indice) => (
              <LinhaConteudo
                key={conteudo.id}
                conteudo={conteudo}
                indice={indice}
              />
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function LinhaConteudo({
  conteudo,
  indice,
}: {
  conteudo: ConteudoDaTrilha;
  indice: number;
}) {
  const capa = conteudo.thumbnailDesktop ?? conteudo.thumbnailMobile;

  return (
    <li>
      <Link
        href={`/conteudo/${conteudo.id}`}
        className="border-borda-suave bg-superficie hover:border-acento/50 hover:bg-superficie-2 ease-suave flex items-center gap-4 rounded-xl border p-3 transition-[border-color,background-color] duration-200 active:scale-[0.995]"
      >
        <span className="text-texto-3 w-6 shrink-0 text-center text-sm font-bold tabular-nums">
          {indice + 1}
        </span>

        <span className="bg-superficie-2 relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg sm:w-32">
          {capa && (
            <Image
              src={capa}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
            />
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-texto-3 text-[11px] font-semibold tracking-wider uppercase">
            {rotuloTipo(conteudo.tipo)}
            {conteudo.level ? ` · ${conteudo.level}` : ""}
          </span>
          <span className="text-texto text-sm leading-snug font-semibold">
            {conteudo.titulo}
          </span>
          {conteudo.descricao && (
            <span className="text-texto-3 line-clamp-1 text-xs">
              {conteudo.descricao}
            </span>
          )}
        </span>

        <svg viewBox="0 0 20 20" aria-hidden="true" className="text-texto-3 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 4.5 13.5 10 8 15.5" />
        </svg>
      </Link>
    </li>
  );
}
