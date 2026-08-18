import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listarListas } from "@/lib/queries";
import { formatarDuracao } from "@/lib/format";
import { AcoesLista } from "@/components/acoes-lista";
import { Estatistica, ICONES_ESTATISTICA } from "@/components/estatistica";
import { EstadoVazio } from "@/components/estado-vazio";
import { IlustracaoListasVazias } from "@/components/ilustracoes";

export const metadata: Metadata = { title: "Listas" };

export default async function PaginaListas() {
  const listas = await listarListas();

  /*
   * Agregados do cabeçalho. Cada campo já vem fechado pelo backend por lista,
   * então aqui é só somatório — nenhuma chamada extra à API.
   */
  const numeros = {
    ativas: listas.filter((t) => t.status === "EM_ANDAMENTO").length,
    aulasConcluidas: listas.reduce((s, t) => s + (t.aulasConcluidas ?? 0), 0),
    totalAulas: listas.reduce((s, t) => s + (t.totalAulas ?? 0), 0),
    tempo: listas.reduce((s, t) => s + (t.tempoAssistidoSegundos ?? 0), 0),
  };

  const vazio = listas.length === 0;

  return (
    <div className="calha flex w-full flex-1 flex-col gap-6 py-8 sm:gap-8 sm:py-10">
      {/*
        Sem nenhuma lista o cabeçalho inteiro sai de cena — título incluído —
        e quem assume é o estado vazio, que traz o <h1> para o centro. Um
        cabeçalho alinhado à esquerda sobre um bloco centrado deixaria dois
        eixos competindo, e os três cartões seriam zeros ao lado de um convite
        para criar a primeira lista.

        Com listas, os números ficam ao LADO do título, não empilhados: no
        desktop a coluna de texto sozinha deixaria metade da faixa vazia. No
        celular a grade quebra para uma coluna e eles caem abaixo da descrição.
      */}
      {!vazio && (
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex flex-col items-start gap-1.5 sm:gap-2">
            <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
              Listas
            </h1>
            <p className="text-texto-3 text-sm">
              Suas coleções de aulas, na ordem em que você quer assistir.
            </p>

            <Link
              href="/listas/nova"
              className="bg-acento text-white hover:bg-acento-hover mt-2 flex min-h-11 items-center rounded-full px-5 text-sm font-bold transition-colors"
            >
              Nova lista
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:shrink-0 lg:gap-4">
            <Estatistica
              valor={String(numeros.ativas)}
              rotulo="Listas ativas"
              detalhe="em andamento"
              icone={ICONES_ESTATISTICA.livro}
            />
            <Estatistica
              valor={String(numeros.aulasConcluidas)}
              rotulo="Aulas concluídas"
              detalhe={`de ${numeros.totalAulas} no total`}
              icone={ICONES_ESTATISTICA.capelo}
            />
            <Estatistica
              valor={formatarDuracao(numeros.tempo) || "0 min"}
              rotulo="Tempo total"
              detalhe="de aprendizado"
              icone={ICONES_ESTATISTICA.relogio}
            />
          </div>
        </header>
      )}

      {vazio ? (
        <EstadoVazio
          ilustracao={<IlustracaoListasVazias />}
          titulo="Listas"
          descricao="Você ainda não tem nenhuma. Junte as aulas que quiser, na ordem que preferir, e acompanhe seu progresso por elas — uma lista para cada assunto que estiver estudando."
        >
          <Link
            href="/listas/nova"
            className="bg-acento text-white hover:bg-acento-hover flex min-h-11 items-center rounded-full px-6 text-sm font-bold transition-colors"
          >
            Criar minha primeira lista
          </Link>
          <Link
            href="/inicio"
            className="border-borda text-texto-2 hover:border-acento/60 hover:text-texto flex min-h-11 items-center rounded-full border px-6 text-sm font-semibold transition-colors"
          >
            Explorar o catálogo
          </Link>
        </EstadoVazio>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listas.map((lista) => {
            const capa = lista.thumbnailDesktopUrl ?? lista.thumbnailUrl;

            return (
              <li key={lista.id} className="relative">
                <AcoesLista listaId={lista.id} titulo={lista.titulo} />

                <Link
                  href={`/listas/${lista.id}`}
                  className="border-borda-suave bg-superficie hover:border-acento/60 ease-suave flex h-full flex-col overflow-hidden rounded-xl border transition-[border-color,transform] duration-200 active:scale-[0.99]"
                >
                  <div className="bg-superficie-2 relative aspect-video">
                    {capa && (
                      <Image
                        src={capa}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 380px"
                        className="object-cover"
                      />
                    )}
                    <span className="bg-fundo/85 text-texto-2 absolute right-2 bottom-2 rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
                      {lista.aulasConcluidas}/{lista.totalAulas} aulas
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <h2 className="font-display leading-snug font-semibold text-balance">
                      {lista.titulo}
                    </h2>

                    {lista.descricao && (
                      <p className="text-texto-3 line-clamp-2 text-sm leading-relaxed">
                        {lista.descricao}
                      </p>
                    )}

                    <div className="mt-auto flex flex-col gap-2 pt-1">
                      <div className="text-texto-3 flex items-center justify-between text-xs tabular-nums">
                        <span>{lista.progressoPercent}% concluído</span>
                        {lista.tempoRestanteSegundos > 0 && (
                          <span>
                            faltam {formatarDuracao(lista.tempoRestanteSegundos)}
                          </span>
                        )}
                      </div>
                      <div className="bg-superficie-2 h-1.5 overflow-hidden rounded-full">
                        <div
                          className="bg-acento ease-suave h-full rounded-full transition-[width] duration-500"
                          style={{
                            width: `${Math.min(Math.max(lista.progressoPercent, 0), 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
