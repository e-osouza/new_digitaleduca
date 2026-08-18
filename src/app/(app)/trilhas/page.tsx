import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listarTrilhas } from "@/lib/queries";
import { Selo } from "@/components/selo";
import { EstadoVazio } from "@/components/estado-vazio";
import { IlustracaoSemTrilhas } from "@/components/ilustracoes";
import type { Trilha } from "@/types/api";

export const metadata: Metadata = { title: "Trilhas" };

/** Capa da trilha: prioriza a arte de destaque, depois desktop, depois mobile. */
function capaTrilha(trilha: Trilha) {
  return (
    trilha.thumbnailDestaque ??
    trilha.thumbnailDesktop ??
    trilha.thumbnailMobile
  );
}

export default async function PaginaTrilhas() {
  const trilhas = await listarTrilhas();

  const vazio = trilhas.length === 0;

  return (
    <div className="calha flex w-full flex-1 flex-col gap-6 py-8 sm:gap-8 sm:py-10">
      {/*
        Sem trilhas o cabeçalho sai de cena — título incluído — e o estado
        vazio traz o <h1> para o centro, junto da ilustração.
      */}
      {!vazio && (
        <header className="flex flex-col items-start gap-1.5 sm:gap-2">
          <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            Trilhas
          </h1>
          <p className="text-texto-3 text-sm">
            Formações de aprendizado com curadoria, em sequência.
          </p>
        </header>
      )}

      {/*
        Diferente das outras telas vazias, aqui NÃO há um gesto a convidar: as
        trilhas são curadoria da equipe, e o usuário não monta nenhuma. Por
        isso o texto explica de quem é a vez, e a única ação leva para onde há
        conteúdo — em vez de sugerir uma tarefa impossível.
      */}
      {vazio ? (
        <EstadoVazio
          ilustracao={<IlustracaoSemTrilhas />}
          titulo="Trilhas"
          descricao="As formações são montadas pela nossa equipe, e nenhuma foi publicada ainda. Assim que a primeira sair, ela aparece aqui."
        >
          <Link
            href="/inicio"
            className="bg-acento text-white hover:bg-acento-hover flex min-h-11 items-center rounded-full px-6 text-sm font-bold transition-colors"
          >
            Explorar o catálogo
          </Link>
        </EstadoVazio>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {trilhas.map((trilha) => {
            const capa = capaTrilha(trilha);

            return (
              <li key={trilha.id}>
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
                    {trilha.nivel && (
                      <span className="absolute top-2 left-2">
                        <Selo variacao="neutro">{trilha.nivel}</Selo>
                      </span>
                    )}
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

                    <span className="text-texto-3 mt-auto pt-1 text-xs font-medium tabular-nums">
                      {trilha.totalConteudos}{" "}
                      {trilha.totalConteudos === 1 ? "conteúdo" : "conteúdos"}
                    </span>
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
