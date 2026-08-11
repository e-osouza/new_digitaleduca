import type { Metadata } from "next";
import Link from "next/link";
import { emAndamento, paraCard } from "@/lib/queries";
import { CardConteudo } from "@/components/card-conteudo";

export const metadata: Metadata = { title: "Continuar assistindo" };

export default async function MeusConteudos() {
  // O endpoint já devolve título, capas e duração de cada conteúdo.
  const itens = await emAndamento(50);

  return (
    <div className="calha flex w-full flex-col gap-6 py-8 sm:gap-8 sm:py-10">
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Continuar assistindo
        </h1>
        <p className="text-texto-3 text-sm">
          Tudo que você começou e ainda não terminou.
        </p>
      </div>

      {itens.length === 0 ? (
        <div className="border-borda-suave flex flex-col items-start gap-4 rounded-xl border p-8">
          <div className="flex flex-col gap-1.5">
            <p className="text-texto font-semibold">
              Você ainda não começou nenhum conteúdo.
            </p>
            <p className="text-texto-3 text-sm">
              Assim que assistir a uma aula, ela aparece aqui com o ponto em que
              você parou.
            </p>
          </div>
          <Link
            href="/inicio"
            className="bg-acento text-fundo hover:bg-acento-hover rounded-full px-5 py-2.5 text-sm font-bold transition-colors"
          >
            Explorar o catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {itens.map((item) => (
            <CardConteudo
              key={item.conteudoId}
              conteudo={paraCard(item)}
              largura="w-full"
              progresso={item.percentualAssistido}
              duracaoSegundos={item.duracao}
            />
          ))}
        </div>
      )}
    </div>
  );
}
