import Image from "next/image";
import Link from "next/link";
import type { Conteudo, ConteudoResumo } from "@/types/api";
import {
  capaDoConteudo,
  duracaoTotal,
  estaLiberado,
  formatarDuracao,
  rotuloTipo,
} from "@/lib/format";
import { Selo } from "@/components/selo";

type ConteudoDeCard = Conteudo | ConteudoResumo;

function temVideos(c: ConteudoDeCard): c is Conteudo {
  return "videos" in c;
}

export function CardConteudo({
  conteudo,
  largura = "card-trilho",
  progresso,
  duracaoSegundos,
  href,
  bloqueado = false,
}: {
  conteudo: ConteudoDeCard;
  /** Duração informada por fora, quando a origem não traz a lista de vídeos. */
  duracaoSegundos?: number;
  /**
   * Classe de largura. O padrão `card-trilho` deriva a largura do container
   * (2 cards no celular, 3 em tablet, 4 no desktop — sempre com um pedaço do
   * próximo espiando). As grades passam `w-full`.
   */
  largura?: string;
  /** 0 a 100. Desenha a barra de continuação quando informado. */
  progresso?: number;
  /** Destino do clique. Na vitrine pública, aponta para o login. */
  href?: string;
  /** Mostra o cadeado indicando que é preciso entrar para assistir. */
  bloqueado?: boolean;
}) {
  const capa = capaDoConteudo(conteudo);
  const liberado = estaLiberado(conteudo);
  const duracao =
    duracaoSegundos ?? (temVideos(conteudo) ? duracaoTotal(conteudo) : 0);

  return (
    <Link
      href={href ?? `/conteudo/${conteudo.id}`}
      className={`group focus-visible:outline-acento ease-suave block shrink-0 transition-transform duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 ${largura}`}
    >
      <article className="flex w-full flex-col gap-2.5">
        <div className="bg-superficie border-borda-suave group-hover:border-acento/60 group-hover:shadow-acento/10 ease-suave relative aspect-video overflow-hidden rounded-xl border transition-[border-color,box-shadow] duration-300 group-hover:shadow-lg">
          {capa ? (
            <Image
              src={capa}
              alt=""
              fill
              sizes="(max-width: 768px) 45vw, (max-width: 1024px) 31vw, 24vw"
              className="ease-suave object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            />
          ) : (
            <div className="text-texto-3 flex h-full items-center justify-center text-xs">
              sem capa
            </div>
          )}

          {liberado && (
            <span className="absolute top-2 left-2">
              <Selo variacao="gratis">Grátis</Selo>
            </span>
          )}

          {bloqueado && (
            <span className="bg-fundo/80 text-acento absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full">
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
                <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
              </svg>
              <span className="sr-only">Entre para assistir</span>
            </span>
          )}

          {duracao > 0 && (
            <span className="bg-fundo/85 text-texto-2 absolute right-2 bottom-2 rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
              {formatarDuracao(duracao)}
            </span>
          )}

          {typeof progresso === "number" && progresso > 0 && (
            <div
              className="bg-fundo/70 absolute inset-x-0 bottom-0 h-1"
              role="presentation"
            >
              <div
                className="bg-acento h-full"
                style={{ width: `${Math.min(progresso, 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-texto-3 text-[11px] font-semibold tracking-wider uppercase">
            {rotuloTipo(conteudo.tipo)}
            {conteudo.level ? ` · ${conteudo.level}` : ""}
          </span>
          <h3 className="text-texto group-hover:text-acento-claro line-clamp-2 text-sm leading-snug font-semibold transition-colors">
            {conteudo.titulo}
          </h3>
        </div>
      </article>
    </Link>
  );
}
