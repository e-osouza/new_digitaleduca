"use client";

import { useMemo } from "react";

/** Barras da onda. 72 dá textura de forma de onda sem virar sopa de pixels. */
const BARRAS = 72;

/**
 * Alturas estáveis por episódio.
 *
 * Gerador determinístico (mulberry32) semeado pelo id: o mesmo episódio tem
 * sempre a mesma silhueta, então a onda não muda de forma a cada render nem
 * "pisca" quando o tempo avança. Episódios diferentes ganham desenhos
 * diferentes, que é o que faz a peça parecer a onda DAQUELE áudio.
 *
 * O ruído é multiplicado por um envelope de senos: som real tem trechos altos
 * e trechos baixos, e ruído puro daria uma cerca de altura uniforme.
 */
function alturasDoEpisodio(semente: number) {
  let estado = (semente || 1) >>> 0;
  const aleatorio = () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return Array.from({ length: BARRAS }, (_, i) => {
    const p = i / (BARRAS - 1);
    const envelope =
      0.55 +
      0.25 * Math.sin(p * Math.PI * 3.1 + 0.7) +
      0.2 * Math.sin(p * Math.PI * 7.3 + 2.1);
    const altura = envelope * (0.55 + aleatorio() * 0.65);
    // Piso de 12%: barra que some deixaria buraco na linha.
    return Math.min(1, Math.max(0.12, altura));
  });
}

/**
 * A onda do episódio, acima da régua.
 *
 * **Ela não mede o áudio de verdade**, e isso é uma limitação real, não um
 * atalho: o som vem do Vimeo por URL assinada e de outra origem, e a Web Audio
 * API não consegue analisar essa faixa sem CORS aberto — pedir a análise
 * derrubaria a reprodução. O desenho é sintético, estável por episódio, e
 * anima enquanto toca.
 *
 * O que ela informa de verdade é o progresso: as barras já ouvidas ficam no
 * acento da marca, as que faltam apagadas. É a mesma informação da régua, na
 * escala que a régua não tem — por isso a onda é decorativa para o leitor de
 * tela (`aria-hidden`), e quem comanda por teclado continua usando a régua.
 */
export function OndaAudio({
  semente,
  progresso,
  tocando,
  aoBuscar,
}: {
  /** Id do episódio — dá a cada um a sua silhueta. */
  semente: number;
  /** 0 a 100. */
  progresso: number;
  tocando: boolean;
  /** Recebe a fração clicada (0 a 1). Sem ela, a onda é só desenho. */
  aoBuscar?: (fracao: number) => void;
}) {
  const alturas = useMemo(() => alturasDoEpisodio(semente), [semente]);

  return (
    <div
      aria-hidden="true"
      onClick={
        aoBuscar &&
        ((evento) => {
          const caixa = evento.currentTarget.getBoundingClientRect();
          aoBuscar(
            Math.min(1, Math.max(0, (evento.clientX - caixa.left) / caixa.width)),
          );
        })
      }
      className={`flex h-12 items-center gap-[2px] sm:h-16 sm:gap-[3px] ${
        aoBuscar ? "cursor-pointer" : ""
      }`}
    >
      {alturas.map((altura, i) => {
        const ouvida = (i + 1) / BARRAS <= progresso / 100;

        return (
          <span
            key={i}
            className={`onda-barra min-w-px flex-1 rounded-full ${
              ouvida ? "bg-acento" : "bg-acento/20"
            }`}
            style={{
              height: `${Math.round(altura * 100)}%`,
              /*
               * Cada barra com o seu compasso: mesma duração para todas daria
               * uma sanfona subindo e descendo em bloco. Os números vêm da
               * própria posição, então também são estáveis entre renders.
               */
              animationDelay: `${((i % 9) * 0.09).toFixed(2)}s`,
              animationDuration: `${(0.85 + (i % 5) * 0.14).toFixed(2)}s`,
              animationPlayState: tocando ? "running" : "paused",
            }}
          />
        );
      })}
    </div>
  );
}
