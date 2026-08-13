import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listarTrilhas } from "@/lib/queries";
import { formatarDuracao } from "@/lib/format";
import { AcoesTrilha } from "@/components/acoes-trilha";
import { Estatistica, ICONES_ESTATISTICA } from "@/components/estatistica";

export const metadata: Metadata = { title: "Trilhas" };

export default async function PaginaTrilhas() {
  const trilhas = await listarTrilhas();

  /*
   * Agregados do cabeçalho. Cada campo já vem fechado pelo backend por trilha,
   * então aqui é só somatório — nenhuma chamada extra à API.
   */
  const numeros = {
    ativas: trilhas.filter((t) => t.status === "EM_ANDAMENTO").length,
    aulasConcluidas: trilhas.reduce((s, t) => s + (t.aulasConcluidas ?? 0), 0),
    totalAulas: trilhas.reduce((s, t) => s + (t.totalAulas ?? 0), 0),
    tempo: trilhas.reduce((s, t) => s + (t.tempoAssistidoSegundos ?? 0), 0),
  };

  return (
    <div className="calha flex w-full flex-col gap-6 py-8 sm:gap-8 sm:py-10">
      {/*
        Os números ficam ao lado do título, não empilhados: no desktop a
        coluna de texto sozinha deixaria metade da faixa vazia. No celular a
        grade quebra para uma coluna e eles caem abaixo da descrição.
      */}
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="flex flex-col items-start gap-1.5 sm:gap-2">
          <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            Trilhas
          </h1>
          <p className="text-texto-3 text-sm">
            Sequências de aulas montadas para um objetivo.
          </p>

          {trilhas.length > 0 && (
            <Link
              href="/trilhas/nova"
              className="bg-acento text-white hover:bg-acento-hover mt-2 flex min-h-11 items-center rounded-full px-5 text-sm font-bold transition-colors"
            >
              Nova trilha
            </Link>
          )}
        </div>

        {/*
          Sem trilha nenhuma os três cartões seriam zeros ao lado de um convite
          para criar a primeira — ruído. Só aparecem quando há o que medir.
        */}
        {trilhas.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3 lg:shrink-0 lg:gap-4">
            <Estatistica
              valor={String(numeros.ativas)}
              rotulo="Trilhas ativas"
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
        )}
      </header>

      {trilhas.length === 0 ? (
        <div className="border-borda-suave bg-superficie flex flex-col items-start gap-4 rounded-xl border p-6 sm:p-8">
          <div className="flex flex-col gap-1.5">
            <p className="text-texto font-semibold">
              Você ainda não tem nenhuma trilha.
            </p>
            <p className="text-texto-3 max-w-md text-sm leading-relaxed">
              Responda seis perguntas rápidas e montamos um caminho para o seu
              objetivo — ou escolha as aulas você mesmo.
            </p>
          </div>
          <Link
            href="/trilhas/nova"
            className="bg-acento text-white hover:bg-acento-hover flex min-h-11 items-center rounded-full px-5 text-sm font-bold transition-colors"
          >
            Criar minha primeira trilha
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {trilhas.map((trilha) => {
            const capa = trilha.thumbnailDesktopUrl ?? trilha.thumbnailUrl;

            return (
              <li key={trilha.id} className="relative">
                <AcoesTrilha trilhaId={trilha.id} titulo={trilha.titulo} />

                <Link
                  href={`/trilhas/${trilha.id}`}
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
                      {trilha.aulasConcluidas}/{trilha.totalAulas} aulas
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <h2 className="font-display leading-snug font-semibold text-balance">
                      {trilha.titulo}
                    </h2>

                    {trilha.descricao && (
                      <p className="text-texto-3 line-clamp-2 text-sm leading-relaxed">
                        {trilha.descricao}
                      </p>
                    )}

                    <div className="mt-auto flex flex-col gap-2 pt-1">
                      <div className="text-texto-3 flex items-center justify-between text-xs tabular-nums">
                        <span>{trilha.progressoPercent}% concluído</span>
                        {trilha.tempoRestanteSegundos > 0 && (
                          <span>
                            faltam {formatarDuracao(trilha.tempoRestanteSegundos)}
                          </span>
                        )}
                      </div>
                      <div className="bg-superficie-2 h-1.5 overflow-hidden rounded-full">
                        <div
                          className="bg-acento ease-suave h-full rounded-full transition-[width] duration-500"
                          style={{
                            width: `${Math.min(Math.max(trilha.progressoPercent, 0), 100)}%`,
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
