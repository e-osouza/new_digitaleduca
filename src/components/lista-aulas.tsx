import Image from "next/image";
import Link from "next/link";
import { capaVertical, formatarRelogio } from "@/lib/format";
import type { Conteudo, Video } from "@/types/api";

/**
 * Lista de aulas do conteúdo. Quando existem módulos, cada um vira um bloco
 * com seu título; vídeos soltos ficam num bloco sem cabeçalho.
 *
 * A miniatura e o progresso vêm do próprio `GET /conteudos/{id}`: o backend
 * guarda `thumbnailUrl` (cacheada do Vimeo) e o `ProgressoVideo` já filtrado
 * para o usuário logado.
 */
export function ListaAulas({ conteudo }: { conteudo: Conteudo }) {
  const modulos = conteudo.modulos ?? [];

  /*
   * Um vídeo que pertence a um módulo também aparece em `conteudo.videos` — a
   * API devolve nos dois lugares. Sem esta subtração a lista sai duplicada.
   * O `select` de `findOne` não traz `moduloId`, então comparamos por id.
   */
  const idsEmModulos = new Set(
    modulos.flatMap((modulo) => (modulo.videos ?? []).map((v) => v.id)),
  );

  const soltos = (conteudo.videos ?? []).filter(
    (video) => !idsEmModulos.has(video.id),
  );

  const vistos = new Set<number>();
  const semRepetir = (videos: Video[]) =>
    videos.filter((video) => {
      if (vistos.has(video.id)) return false;
      vistos.add(video.id);
      return true;
    });

  const blocos = [
    ...(soltos.length > 0
      ? [{ id: 0, titulo: null, videos: semRepetir(soltos) }]
      : []),
    ...modulos.map((modulo) => ({
      id: modulo.id,
      titulo: modulo.titulo,
      videos: semRepetir(modulo.videos ?? []),
    })),
  ].filter((bloco) => bloco.videos.length > 0);

  if (blocos.length === 0) return null;

  const capaReserva = capaVertical(conteudo);

  return (
    <div className="flex flex-col gap-6">
      {blocos.map((bloco) => (
        <section key={bloco.id} className="flex flex-col gap-3">
          {bloco.titulo && (
            <h3 className="text-texto-2 text-xs font-semibold tracking-wider uppercase">
              {bloco.titulo}
            </h3>
          )}

          <ul className="flex flex-col gap-2.5">
            {bloco.videos.map((video) => (
              <li key={video.id}>
                <LinhaAula
                  video={video}
                  conteudoId={conteudo.id}
                  capaReserva={capaReserva}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function LinhaAula({
  video,
  conteudoId,
  capaReserva,
}: {
  video: Video;
  conteudoId: number;
  capaReserva: string | null;
}) {
  const progresso = video.ProgressoVideo?.[0];
  const assistidos = progresso?.concluido
    ? (video.duracao ?? 0)
    : (progresso?.segundos ?? 0);

  const percentual =
    video.duracao && video.duracao > 0
      ? Math.min(100, Math.round((assistidos / video.duracao) * 100))
      : 0;

  const capa = video.thumbnailUrl ?? capaReserva;

  return (
    <Link
      href={`/assistir/${conteudoId}?aula=${video.id}`}
      className="border-borda-suave bg-superficie hover:border-acento/60 hover:bg-superficie-2 ease-suave flex items-center gap-4 rounded-xl border p-3 transition-[border-color,background-color,transform] duration-200 active:scale-[0.995]"
    >
      <span className="bg-superficie-2 relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg sm:w-36">
        {capa && (
          <Image
            src={capa}
            alt=""
            fill
            sizes="144px"
            className="object-cover"
          />
        )}

        {/*
          Marca sobre a miniatura: play no que falta ver, check verde no que já
          foi. É a leitura mais rápida do que resta — o texto "concluído" ao
          lado só se percebe depois de ler a linha inteira.
        */}
        <span className="absolute inset-0 flex items-center justify-center">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm ${
              progresso?.concluido
                ? "bg-sucesso text-white"
                : "bg-fundo/70 text-texto"
            }`}
          >
            {progresso?.concluido ? (
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 10.5 3.5 3.5L15 7" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 translate-x-px" fill="currentColor">
                <path d="M4 2.5v11l9-5.5-9-5.5Z" />
              </svg>
            )}
          </span>
        </span>

        {percentual > 0 && (
          <span
            role="presentation"
            className="absolute inset-x-0 bottom-0 h-1 bg-black/60"
          >
            {/* Mesmo azul da barra dos cards — ver `--color-progresso`. */}
            <span
              className="bg-progresso block h-full"
              style={{ width: `${percentual}%` }}
            />
          </span>
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-texto text-sm leading-snug font-semibold">
          {video.titulo}
        </span>

        <span className="text-texto-3 flex flex-wrap items-center gap-x-3 text-xs tabular-nums">
          {video.duracao ? <span>{formatarRelogio(video.duracao)}</span> : null}

          {assistidos > 0 && (
            <span className={progresso?.concluido ? "text-sucesso" : undefined}>
              {progresso?.concluido
                ? "concluído"
                : `${formatarRelogio(assistidos)} assistidos`}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}
