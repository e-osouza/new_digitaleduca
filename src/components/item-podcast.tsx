import Image from "next/image";
import Link from "next/link";
import type { Conteudo } from "@/types/api";
import { capaVertical, duracaoTotal, formatarDuracao } from "@/lib/format";
import { separarTitulo } from "@/lib/podcast";

/**
 * Episódio na listagem de podcasts, em formato de feed.
 *
 * Os podcasts do acervo têm um único vídeo de ~21 min e o título já vem no
 * padrão "Convidado — Tema", então o card de pôster usado nos cursos não serve:
 * ele esconde o convidado, que é justamente o motivo de alguém clicar, e sugere
 * uma série que não existe. Aqui a capa é quadrada, o nome é a manchete e o
 * tema vem abaixo.
 */
export function ItemPodcast({
  conteudo,
  progresso,
}: {
  conteudo: Conteudo;
  /** 0 a 100. Desenha a barra de continuação sobre a capa. */
  progresso?: number;
}) {
  const capa = capaVertical(conteudo);
  const duracao = duracaoTotal(conteudo);
  const { convidado, tema } = separarTitulo(conteudo.titulo);

  return (
    <Link
      href={`/conteudo/${conteudo.id}`}
      className="group border-borda-suave bg-superficie hover:border-acento/60 focus-visible:outline-acento ease-suave flex items-center gap-4 rounded-xl border p-3 transition-[border-color,background-color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 sm:gap-5 sm:p-4"
    >
      {/* Capa quadrada: a arte do acervo vem em 850×971, quase quadrada já. */}
      <div className="bg-superficie-2 relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg sm:w-24">
        {capa && (
          <Image
            src={capa}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
          />
        )}

        <span
          aria-hidden="true"
          className="ease-suave absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          <span className="bg-acento-claro text-fundo flex h-9 w-9 items-center justify-center rounded-full">
            <svg viewBox="0 0 16 16" className="ml-0.5 h-4 w-4" fill="currentColor">
              <path d="M4 2.5v11l9-5.5-9-5.5Z" />
            </svg>
          </span>
        </span>

        {typeof progresso === "number" && progresso > 0 && (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(Math.min(progresso, 100))}
            aria-label={`${Math.round(Math.min(progresso, 100))}% ouvido`}
            className="absolute inset-x-0 bottom-0 h-[5px] bg-black/45"
          >
            <div
              className="bg-acento-claro h-full"
              style={{ width: `${Math.min(progresso, 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-texto group-hover:text-acento line-clamp-1 font-semibold transition-colors">
          {convidado}
        </h3>
        {tema && (
          <p className="text-texto-2 line-clamp-2 text-sm leading-snug">{tema}</p>
        )}
        {duracao > 0 && (
          <p className="text-texto-3 text-xs tabular-nums">
            {formatarDuracao(duracao)}
          </p>
        )}
      </div>
    </Link>
  );
}
