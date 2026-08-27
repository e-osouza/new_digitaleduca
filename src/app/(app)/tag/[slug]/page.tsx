import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mapaDeProgresso, obterTagPorSlug } from "@/lib/queries";
import { CardConteudo } from "@/components/card-conteudo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await obterTagPorSlug(slug);
  return { title: tag?.nome ? `#${tag.nome}` : "Tag" };
}

export default async function PaginaTag({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) notFound();

  const [tag, progresso] = await Promise.all([
    obterTagPorSlug(slug),
    mapaDeProgresso(),
  ]);
  if (!tag) notFound();

  /*
   * `GET /tags/slug/{slug}` devolve os vínculos, não os conteúdos direto — cada
   * item é `{ conteudoId, conteudo }`. Filtramos vínculos órfãos e removemos
   * repetições pelo id do conteúdo.
   */
  const conteudos = [
    ...new Map(
      (tag.conteudos ?? [])
        .map((vinculo) => vinculo.conteudo)
        .filter(Boolean)
        .map((conteudo) => [conteudo.id, conteudo] as const),
    ).values(),
  ];

  return (
    <div className="calha flex w-full flex-col gap-6 py-8 sm:gap-8 sm:py-10">
      <header className="flex flex-col gap-1.5 sm:gap-2">
        <span className="text-acento text-xs font-semibold tracking-wider uppercase">
          Tag
        </span>
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          {tag.nome}
        </h1>
        <p className="text-texto-3 text-sm tabular-nums">
          {conteudos.length}{" "}
          {conteudos.length === 1 ? "conteúdo" : "conteúdos"} com esta tag
        </p>
      </header>

      {conteudos.length === 0 ? (
        <p className="text-texto-3 text-sm">
          Nenhum conteúdo associado a esta tag no momento.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {conteudos.map((conteudo) => (
            <CardConteudo
              key={conteudo.id}
              conteudo={conteudo}
              largura="w-full"
              progresso={progresso.get(conteudo.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
