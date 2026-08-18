"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Selo } from "@/components/selo";

/** Dados já preparados no servidor — o slide só apresenta. */
export type SlideDestaque = {
  id: number;
  titulo: string;
  descricao: string | null;
  capa: string | null;
  /*
   * Destino do clique, montado por quem constrói o slide. Vem pronto porque o
   * herói não conhece o TIPO cru do conteúdo (recebe o rótulo já traduzido), e
   * podcast não vai para a ficha como os demais — abre tocando.
   */
  href: string;
  tipo: string;
  duracao: string | null;
  instrutor: string | null;
};

const INTERVALO = 5000;

export function HeroiSlide({ slides }: { slides: SlideDestaque[] }) {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const referencia = useRef<HTMLElement>(null);

  const total = slides.length;

  useEffect(() => {
    if (total <= 1 || pausado) return;

    // Quem pediu menos movimento não deve receber troca automática.
    const menosMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (menosMovimento) return;

    const relogio = window.setInterval(
      () => setAtual((indice) => (indice + 1) % total),
      INTERVALO,
    );
    return () => window.clearInterval(relogio);
  }, [total, pausado]);

  if (total === 0) return null;

  return (
    <section
      ref={referencia}
      aria-roledescription="carrossel"
      aria-label="Conteúdos em destaque"
      // Pausa enquanto o usuário lê ou navega pelo teclado dentro do bloco.
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget)) {
          setPausado(false);
        }
      }}
      className="relative"
    >
      <div className="relative min-h-[340px] overflow-hidden sm:min-h-[420px] lg:min-h-[500px]">
        {slides.map((slide, indice) => {
          const ativo = indice === atual;

          return (
            <div
              key={slide.id}
              aria-roledescription="slide"
              aria-label={`${indice + 1} de ${total}`}
              aria-hidden={!ativo}
              inert={!ativo}
              className={`ease-suave transition-opacity duration-700 ${
                ativo
                  ? "relative opacity-100"
                  : "pointer-events-none absolute inset-0 opacity-0"
              }`}
            >
              <div className="absolute inset-0">
                {slide.capa && (
                  /*
                   * Os três slides ficam montados o tempo todo, para o
                   * cruzamento de opacidade ter o que animar. Sem prioridade
                   * declarada, o navegador baixaria as três imagens de largura
                   * inteira ao mesmo tempo e o primeiro quadro — que é o LCP da
                   * home — disputaria banda com dois slides que ninguém está
                   * vendo. `low` nos demais mantém a ordem certa sem tirá-los do
                   * DOM: quando o carrossel virar, eles já terão chegado.
                   */
                  <Image
                    src={slide.capa}
                    alt=""
                    fill
                    priority={indice === 0}
                    fetchPriority={indice === 0 ? "high" : "low"}
                    sizes="100vw"
                    className="object-cover object-center"
                  />
                )}
                <div className="veu-heroi absolute inset-0" />
              </div>

              <div className="sobre-capa calha relative flex min-h-[340px] w-full flex-col justify-end gap-4 pt-20 pb-10 sm:min-h-[420px] sm:gap-5 sm:pt-24 sm:pb-12 lg:min-h-[500px]">
                <div className="flex flex-wrap items-center gap-2">
                  <Selo variacao="acento">{slide.tipo}</Selo>
                  {slide.duracao && <Selo>{slide.duracao}</Selo>}
                </div>

                <h1 className="font-display max-w-3xl text-2xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                  {slide.titulo}
                </h1>

                {slide.descricao && (
                  <p className="text-texto-2 line-clamp-3 max-w-xl text-sm leading-relaxed sm:line-clamp-none sm:text-base">
                    {slide.descricao}
                  </p>
                )}

                {slide.instrutor && (
                  <p className="text-texto-3 text-sm">
                    com{" "}
                    <span className="text-texto-2 font-medium">
                      {slide.instrutor}
                    </span>
                  </p>
                )}

                <div className="pt-1">
                  <Link
                    href={slide.href}
                    tabIndex={ativo ? undefined : -1}
                    className="bg-acento text-white hover:bg-acento-hover ease-suave inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm font-bold transition-all duration-200 hover:gap-3 active:scale-95"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                      className="h-4 w-4"
                      fill="currentColor"
                    >
                      <path d="M4 2.5v11l9-5.5-9-5.5Z" />
                    </svg>
                    Assistir agora
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {total > 1 && (
        <div className="calha flex w-full items-center gap-2 pt-4">
          {slides.map((slide, indice) => {
            const ativo = indice === atual;

            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => setAtual(indice)}
                aria-label={`Ir para ${slide.titulo}`}
                aria-current={ativo ? "true" : undefined}
                className="group py-2"
              >
                <span
                  className={`ease-suave block h-1.5 rounded-full transition-all duration-300 ${
                    ativo
                      ? "bg-acento w-8"
                      : "bg-borda group-hover:bg-texto-3 w-4"
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
