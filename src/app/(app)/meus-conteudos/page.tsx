import type { Metadata } from "next";
import Link from "next/link";
import { emAndamento, paraCard } from "@/lib/queries";
import { CardConteudo } from "@/components/card-conteudo";
import { EstadoVazio } from "@/components/estado-vazio";
import { IlustracaoEmAndamentoVazio } from "@/components/ilustracoes";
import { rotaDoEpisodio } from "@/lib/podcast";

export const metadata: Metadata = { title: "Continuar assistindo" };

export default async function MeusConteudos() {
  // O endpoint já devolve título, capas e duração de cada conteúdo.
  const itens = await emAndamento(50);

  const vazio = itens.length === 0;

  return (
    <div className="calha flex w-full flex-1 flex-col gap-6 py-8 sm:gap-8 sm:py-10">
      {/*
        Sem nada em andamento o cabeçalho sai de cena — título incluído — e o
        estado vazio traz o <h1> para o centro, junto da ilustração. Um título
        alinhado à esquerda sobre um bloco centrado deixaria dois eixos
        competindo.
      */}
      {!vazio && (
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            Continuar assistindo
          </h1>
          <p className="text-texto-3 text-sm">
            Tudo que você começou e ainda não terminou.
          </p>
        </div>
      )}

      {vazio ? (
        <EstadoVazio
          ilustracao={<IlustracaoEmAndamentoVazio />}
          titulo="Continuar assistindo"
          descricao="Nada em andamento por aqui. Assim que você começar uma aula, ela aparece nesta página no ponto exato em que você parou."
        >
          <Link
            href="/inicio"
            className="bg-acento text-white hover:bg-acento-hover flex min-h-11 items-center rounded-full px-6 text-sm font-bold transition-colors"
          >
            Explorar o catálogo
          </Link>
        </EstadoVazio>
      ) : (
        // Teto de 4 colunas. A arte é deitada, como no trilho da home de onde
        // esta página é o "Ver tudo": uma quinta coluna estreitaria demais o
        // 16/9, e no celular dois cards lado a lado ficariam ilegíveis.
        <div className="xs:grid-cols-2 grid grid-cols-1 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {itens.map((item) => (
            <CardConteudo
              key={item.conteudoId}
              conteudo={paraCard(item)}
              largura="w-full"
              progresso={item.percentualAssistido}
              duracaoSegundos={item.duracao}
              /*
               * Numa lista chamada "Continuar assistindo" o clique tem de voltar
               * a tocar. `?assistir=1` abre o player em tela cheia sobre a ficha
               * do conteúdo — ao fechar, a pessoa fica nela.
               */
              href={
                item.tipo === "PODCAST"
                  ? rotaDoEpisodio(item.conteudoId)
                  : `/conteudo/${item.conteudoId}?assistir=1`
              }
              orientacao="horizontal"
            />
          ))}
        </div>
      )}
    </div>
  );
}
