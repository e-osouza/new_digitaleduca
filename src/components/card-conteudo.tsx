import Image from "next/image";
import Link from "next/link";
import type { Conteudo, ConteudoResumo } from "@/types/api";
import {
  capaDoConteudo,
  capaVertical,
  duracaoTotal,
  estaLiberado,
  formatarDuracao,
  rotuloTipo,
} from "@/lib/format";
import { Selo } from "@/components/selo";
import { rotaDoEpisodio } from "@/lib/podcast";

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
  orientacao = "vertical",
  numero,
  prioritaria = false,
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
  /**
   * `vertical` usa a arte em retrato (7/8), padrão do catálogo. `horizontal`
   * usa a arte deitada em 16/9 — a mesma proporção do player, o que faz o
   * trilho "Continue de onde parou" parecer a continuação da tela de aula.
   * Combine com `largura="card-trilho-largo"`.
   */
  orientacao?: "vertical" | "horizontal";
  /**
   * Posição no ranking, desenhada no canto superior esquerdo. Só faz sentido
   * em trilhos ordenados — nas grades comuns a numeração seria arbitrária.
   */
  numero?: number;
  /**
   * Tira a capa da fila preguiçosa.
   *
   * `next/image` adia toda imagem por padrão, e num catálogo isso é certo em
   * quase todo lugar — menos no card que o navegador escolhe como LCP. Medido
   * na home em 4G: o maior elemento da primeira tela era justamente a capa do
   * primeiro card, marcada `loading="lazy"` e `fetchPriority="auto"`. O
   * navegador só a pedia depois de calcular o layout, e ela ainda entrava na
   * fila atrás de tudo. Quem monta a lista sabe quais cards abrem a tela; só
   * esses recebem isto.
   */
  prioritaria?: boolean;
}) {
  const deitado = orientacao === "horizontal";
  /*
   * Podcast é sempre quadrado, a convenção do formato — e a decisão sai do
   * próprio conteúdo, não de quem chama. Em listas misturadas (busca,
   * categoria, relacionados) o chamador não tem como saber o tipo de cada item.
   *
   * A arte em pé do acervo vem em 850×971, quase 1:1, então o recorte quadrado
   * não perde nada de relevante.
   */
  // Podcast é sempre quadrado — inclusive no trilho deitado, onde antes virava
  // 16:9 e cortava a arte de álbum.
  const podcast = conteudo.tipo === "PODCAST";
  const quadrado = podcast;

  // Deitado usa a arte horizontal (`thumbnailDesktop`); a vertical/quadrada vem
  // de `thumbnailMobile`. Podcast puxa sempre a quadrada, mesmo deitado.
  const capa =
    deitado && !podcast ? capaDoConteudo(conteudo) : capaVertical(conteudo);
  const liberado = estaLiberado(conteudo);
  const duracao =
    duracaoSegundos ?? (temVideos(conteudo) ? duracaoTotal(conteudo) : 0);

  /*
   * Podcast escapa da ficha do conteúdo e vai direto para a tela do podcast,
   * já tocando. O `href` explícito continua vencendo — é ele que manda a
   * vitrine pública para o login.
   */
  const destinoPadrao =
    conteudo.tipo === "PODCAST"
      ? rotaDoEpisodio(conteudo.id)
      : `/conteudo/${conteudo.id}`;

  return (
    <Link
      href={href ?? destinoPadrao}
      className={`group focus-visible:outline-acento ease-suave block shrink-0 transition-transform duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 ${largura}`}
    >
      <article className="flex w-full flex-col gap-2.5">
        {/*
          Sem borda: a capa sangra até o canto arredondado. A moldura clara
          desenhava um retângulo em volta de cada arte e, num trilho, virava
          uma grade de contornos disputando atenção com as próprias imagens.
          O realce de hover fica por conta da sombra e do zoom da capa.
        */}
        <div
          className={`bg-superficie group-hover:shadow-acento/10 ease-suave relative overflow-hidden rounded-xl transition-shadow duration-300 group-hover:shadow-lg ${
            quadrado
              ? "aspect-square"
              : deitado
                ? "aspect-video"
                : "aspect-[7/8]"
          }`}
        >
          {capa ? (
            <Image
              src={capa}
              alt=""
              fill
              sizes={
                deitado
                  ? "(max-width: 768px) 85vw, (max-width: 1024px) 46vw, 31vw"
                  : "(max-width: 768px) 45vw, (max-width: 1024px) 31vw, 24vw"
              }
              className="ease-suave object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              /*
               * 55 em vez dos 75 padrão. A capa do card é servida a 384px e
               * exibida com ~163px de largura no celular; nessa escala a
               * diferença não se vê, e as 19 capas da home caem de 307 KB para
               * 255 KB. O herói e o banner ficam em 75 — ali a arte ocupa a
               * largura da tela e o artefato apareceria.
               */
              quality={55}
              priority={prioritaria}
            />
          ) : (
            <div className="text-texto-3 flex h-full items-center justify-center text-xs">
              sem capa
            </div>
          )}

          {/*
            Véu no pé da capa, só quando há barra. Ele existe para a barra não
            depender da foto: sobre um fundo claro ou movimentado, o azul
            sozinho se dissolvia. Vem antes dos selos no DOM para ficar atrás
            deles.
          */}
          {typeof progresso === "number" && progresso > 0 && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/75 via-black/35 to-transparent"
            />
          )}

          {typeof numero === "number" && (
            <span className="bg-acento-claro text-fundo font-display absolute top-2 left-2 flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-sm font-bold tabular-nums">
              {numero}
              <span className="sr-only">º mais assistido</span>
            </span>
          )}

          {liberado && (
            <span className="absolute top-2 right-2">
              <Selo variacao="gratis">Grátis</Selo>
            </span>
          )}

          {duracao > 0 && (
            <span className="bg-fundo/85 text-texto-2 absolute right-2 bottom-2 rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
              {formatarDuracao(duracao)}
            </span>
          )}

          {typeof progresso === "number" && progresso > 0 && (
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(Math.min(progresso, 100))}
              aria-label={`${Math.round(Math.min(progresso, 100))}% assistido`}
              className="absolute inset-x-0 bottom-0 h-1.5 bg-black/60"
            >
              <div
                className="bg-progresso shadow-progresso/70 h-full shadow-[0_0_10px_1px]"
                style={{ width: `${Math.min(progresso, 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-texto-3 text-[11px] font-semibold tracking-wider uppercase">
            {rotuloTipo(conteudo.tipo)}
          </span>
          {/*
            Duas linhas reservadas, mesmo quando o título ocupa uma.

            Sem isto o trilho onde todos os títulos são curtos termina 19px
            acima do vizinho, e o degrau reaparece por baixo — a arte já está
            alinhada, mas o cartão não. É o mesmo `line-clamp-2` de sempre; o
            que muda é o piso.
          */}
          <h3 className="text-texto group-hover:text-acento-claro line-clamp-2 min-h-[2.375rem] text-sm leading-snug font-semibold transition-colors">
            {conteudo.titulo}
          </h3>
        </div>
      </article>
    </Link>
  );
}
