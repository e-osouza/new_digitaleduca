"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Propaganda } from "@/types/api";

/** Quanto cada banner fica parado antes de ceder a vez. */
const INTERVALO = 6000;
/** Precisa bater com a `duration-500` da faixa — é o gatilho do salto. */
const DESLIZE = 500;

/*
 * Proporção da arte cadastrada no admin: os banners chegam em 1600x333. Não é
 * um recorte — a altura sai da própria imagem, por `h-auto`. Estes números só
 * reservam o espaço certo antes de a imagem carregar, evitando que a página
 * pule. Um banner com outra forma continua aparecendo inteiro: assim que a
 * imagem chega, a proporção natural dela assume.
 */
const LARGURA_ARTE = 1600;
const ALTURA_ARTE = 333;

/**
 * Banners de propaganda cadastrados pelo admin. Um banner só aparece como
 * imagem clicável; vários viram um carrossel que gira sozinho, com indicadores.
 *
 * O giro é infinito de verdade: sempre para o mesmo lado. Antes o índice
 * voltava a zero por `% total`, o que fazia a faixa REBOBINAR — do último ao
 * primeiro ela atravessava todos os banners de volta, e com dois cadastrados
 * o movimento era um vaivém.
 *
 * A saída é o clone: o primeiro banner aparece de novo no fim da fila, então
 * o último desliza para frente até ele. Quando a animação acaba, a faixa
 * salta para o começo com a transição desligada — o clone é idêntico ao que
 * está lá, então o salto não tem o que mostrar.
 */
export function Propagandas({ itens }: { itens: Propaganda[] }) {
  const total = itens.length;
  const gira = total > 1;

  const [atual, setAtual] = useState(0);
  /**
   * Desligado só durante o salto de volta ao começo. É o que separa o
   * movimento visível (deslizar) do reposicionamento invisível (saltar).
   */
  const [deslizando, setDeslizando] = useState(true);

  /* Passa ao próximo. Some enquanto o salto acontece, para não competir. */
  useEffect(() => {
    if (!gira || !deslizando) return;
    const t = setTimeout(() => setAtual((a) => a + 1), INTERVALO);
    return () => clearTimeout(t);
  }, [gira, deslizando, atual]);

  /* Chegou ao clone: espera o deslize terminar e volta ao começo sem animar. */
  useEffect(() => {
    if (!gira || atual !== total) return;
    const t = setTimeout(() => {
      setDeslizando(false);
      setAtual(0);
    }, DESLIZE);
    return () => clearTimeout(t);
  }, [gira, atual, total]);

  /*
   * Religa a transição só depois de o navegador ter pintado a faixa já na
   * posição inicial. Um quadro só não basta: o React agenda a mudança de
   * estado e a pintura no mesmo ciclo, e a transição voltaria a tempo de
   * animar o próprio salto — que é exatamente o vaivém que estamos tirando.
   */
  useEffect(() => {
    if (deslizando) return;
    let segundo = 0;
    const primeiro = requestAnimationFrame(() => {
      segundo = requestAnimationFrame(() => setDeslizando(true));
    });
    return () => {
      cancelAnimationFrame(primeiro);
      cancelAnimationFrame(segundo);
    };
  }, [deslizando]);

  if (total === 0) return null;

  /* A fila mostrada: os banners e, quando gira, o primeiro repetido no fim. */
  const fila = gira ? [...itens, itens[0]] : itens;

  return (
    /*
     * `calha` é a mesma calha lateral dos trilhos abaixo — sem ela o banner
     * encostava nas duas paredes. O herói ACIMA é sangrado de propósito (a
     * foto ocupa a largura toda e só o texto recebe calha), e este bloco
     * acabou herdando esse comportamento sem ser um herói: aqui a arte mora
     * dentro de um cartão arredondado, que precisa da borda para existir.
     */
    <section
      aria-label="Destaques"
      /*
       * A margem do topo é a MESMA medida da calha lateral — `--calha`, que
       * a própria classe `calha` define e que muda por faixa (1,25rem no
       * celular, 2rem no tablet, 2,5rem no desktop). Amarrar na variável, em
       * vez de escrever os três valores, mantém o respiro igual em volta do
       * cartão: se a calha da plataforma mudar um dia, esta margem acompanha.
       */
      className="calha mt-[var(--calha)] flex w-full flex-col gap-2"
    >
      <div className="border-borda-suave bg-superficie-2 relative overflow-hidden rounded-2xl border">
        <div
          className={`flex ${
            deslizando ? "ease-suave transition-transform duration-500" : ""
          }`}
          style={{ transform: `translateX(-${atual * 100}%)` }}
        >
          {fila.map((p, i) => {
            const externo = /^https?:\/\//i.test(p.link);
            const clone = i === total;
            return (
              <a
                key={clone ? `${p.id}-clone` : p.id}
                href={p.link}
                {...(externo
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                /*
                 * O clone é decoração: quem lê a tela por leitor já ouviu esse
                 * banner na primeira posição, e o teclado não deve parar duas
                 * vezes no mesmo link.
                 */
                {...(clone ? { "aria-hidden": true, tabIndex: -1 } : {})}
                className="block w-full shrink-0"
                title={p.titulo ?? undefined}
              >
                <Image
                  src={p.imagem}
                  alt={clone ? "" : (p.titulo ?? "")}
                  width={LARGURA_ARTE}
                  height={ALTURA_ARTE}
                  sizes="100vw"
                  /*
                   * A arte aparece inteira. Antes o bloco tinha altura fixa
                   * (h-40/h-48/h-56) e a imagem entrava com `object-cover`,
                   * que preenchia essa caixa cortando o que sobrasse. Como a
                   * peça é muito deitada (4,8:1) e a caixa fixa era bem mais
                   * alta que isso, o corte caía nas LATERAIS e piorava quanto
                   * menor a tela: sobrava 45% da arte no celular, 82% no
                   * tablet e 98% no desktop. Ou seja, no celular mais da
                   * metade do banner — inclusive as pontas, onde mora a
                   * chamada — simplesmente não era exibida.
                   */
                  className="h-auto w-full"
                  priority
                />
              </a>
            );
          })}
        </div>

      </div>

      {/*
        Os indicadores ficam FORA do cartão, e não sobrepostos à arte.
        Sobrepostos eles funcionavam enquanto o bloco tinha altura fixa e
        sobrava peça embaixo; com a altura vindo da imagem, um banner deitado
        em tela de celular mede uns 70px e os pontos caíam bem no meio da
        frase. Aqui embaixo eles não disputam espaço com nada e continuam
        colados no cartão pelo `gap-2` da seção.
      */}
      {gira && (
        <div className="flex justify-center gap-1.5">
          {itens.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setDeslizando(true);
                setAtual(i);
              }}
              aria-label={`Ir ao destaque ${i + 1}`}
              /* No clone, quem está aceso é o primeiro — é o que se vê. */
              className={`h-2 rounded-full transition-all ${
                i === atual % total
                  ? "bg-acento w-5"
                  : "bg-borda hover:bg-texto-3 w-2"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
