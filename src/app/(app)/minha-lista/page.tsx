import type { Metadata } from "next";
import Link from "next/link";
import { listarSelecionados, mapaDeProgresso } from "@/lib/queries";
import { CardConteudo } from "@/components/card-conteudo";

export const metadata: Metadata = { title: "Minha lista" };

export default async function MinhaLista() {
  const [itens, progresso] = await Promise.all([
    listarSelecionados(),
    mapaDeProgresso(),
  ]);

  return (
    <div className="calha flex w-full flex-col gap-6 py-8 sm:gap-8 sm:py-10">
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Minha lista
        </h1>
        <p className="text-texto-3 text-sm">
          Conteúdos que você salvou para assistir depois.
        </p>
      </div>

      {itens.length === 0 ? (
        <div className="border-borda-suave bg-superficie flex flex-col items-start gap-4 rounded-xl border p-8">
          <div className="flex flex-col gap-1.5">
            <p className="text-texto font-semibold">Sua lista está vazia.</p>
            <p className="text-texto-3 text-sm">
              Use o botão <strong>Salvar</strong> na página de um conteúdo para
              guardá-lo aqui.
            </p>
          </div>
          <Link
            href="/inicio"
            className="bg-acento text-white hover:bg-acento-hover flex min-h-11 items-center rounded-full px-5 text-sm font-bold transition-colors"
          >
            Explorar o catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {itens.map((item) => (
            <CardConteudo
              key={item.id}
              conteudo={item.conteudo}
              largura="w-full"
              progresso={progresso.get(item.conteudo.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
