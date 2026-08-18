import type { Metadata } from "next";
import Link from "next/link";
import { listarSalvos, mapaDeProgresso } from "@/lib/queries";
import { CardConteudo } from "@/components/card-conteudo";
import { EstadoVazio } from "@/components/estado-vazio";
import { IlustracaoSalvosVazios } from "@/components/ilustracoes";

export const metadata: Metadata = { title: "Salvos" };

export default async function MinhaLista() {
  const [itens, progresso] = await Promise.all([
    listarSalvos(),
    mapaDeProgresso(),
  ]);

  const vazio = itens.length === 0;

  return (
    <div className="calha flex w-full flex-1 flex-col gap-6 py-8 sm:gap-8 sm:py-10">
      {/*
        Sem nada salvo o cabeçalho sai de cena — título incluído — e o estado
        vazio traz o <h1> para o centro, junto da ilustração. Um título
        alinhado à esquerda sobre um bloco centrado deixaria dois eixos
        competindo.
      */}
      {!vazio && (
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            Salvos
          </h1>
          <p className="text-texto-3 text-sm">
            Conteúdos que você salvou para assistir depois.
          </p>
        </div>
      )}

      {vazio ? (
        <EstadoVazio
          ilustracao={<IlustracaoSalvosVazios />}
          titulo="Salvos"
          descricao={
            <>
              Você ainda não salvou nada. Use o botão{" "}
              <strong className="text-texto-2 font-semibold">Salvar</strong> na
              página de um conteúdo para guardá-lo aqui e assistir quando
              quiser.
            </>
          }
        >
          <Link
            href="/inicio"
            className="bg-acento text-white hover:bg-acento-hover flex min-h-11 items-center rounded-full px-6 text-sm font-bold transition-colors"
          >
            Explorar o catálogo
          </Link>
        </EstadoVazio>
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
