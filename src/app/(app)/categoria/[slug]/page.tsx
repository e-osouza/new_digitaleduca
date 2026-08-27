import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { conteudosDaCategoria, mapaDeProgresso } from "@/lib/queries";
import { CardConteudo } from "@/components/card-conteudo";
import { Trilho } from "@/components/trilho";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { nome } = await conteudosDaCategoria(slug);
  return { title: nome ?? "Categoria" };
}

export default async function PaginaCategoria({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) notFound();

  const [{ nome, subcategorias }, progresso] = await Promise.all([
    conteudosDaCategoria(slug),
    mapaDeProgresso(),
  ]);
  if (!nome) notFound();

  const total = subcategorias.reduce((soma, s) => soma + s.conteudos.length, 0);

  return (
    <div className="flex flex-col gap-10 pb-8 sm:gap-12">
      <header className="calha flex w-full flex-col gap-1.5 pt-8 sm:gap-2 sm:pt-10">
        <span className="text-acento text-xs font-semibold tracking-wider uppercase">
          Categoria
        </span>
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          {nome}
        </h1>
        <p className="text-texto-3 text-sm tabular-nums">
          {total} {total === 1 ? "conteúdo" : "conteúdos"} em{" "}
          {subcategorias.length}{" "}
          {subcategorias.length === 1 ? "subcategoria" : "subcategorias"}
        </p>
      </header>

      {subcategorias.length === 0 ? (
        <p className="calha text-texto-3 w-full text-sm">
          Nenhum conteúdo publicado nesta categoria ainda.
        </p>
      ) : (
        subcategorias.map((sub) => (
          <Trilho key={sub.id} titulo={sub.nome}>
            {sub.conteudos.map((conteudo) => (
              <CardConteudo
                key={conteudo.id}
                conteudo={conteudo}
                progresso={progresso.get(conteudo.id)}
              />
            ))}
          </Trilho>
        ))
      )}
    </div>
  );
}
