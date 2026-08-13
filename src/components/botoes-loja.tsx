"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

export const LINK_ANDROID =
  "https://play.google.com/store/apps/details?id=vc.agenciadigital.digitaleduca&hl=pt_BR";
export const LINK_IOS =
  "https://apps.apple.com/br/app/digital-educa/id6761863445";

type Plataforma = "ios" | "android" | null;

/*
 * O user agent é uma fonte externa ao React e nunca muda durante a sessão, por
 * isso a assinatura é vazia. Lê-lo num efeito causaria render em cascata, e o
 * servidor precisa de um valor próprio — daí o snapshot `null`, que mantém a
 * ordem original até a hidratação.
 */
const naoMuda = () => () => {};

function lerPlataforma(): Plataforma {
  const agente = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(agente)) return "ios";
  if (/Android/i.test(agente)) return "android";
  return null;
}

/**
 * Botões das lojas. Em celular, a loja do próprio aparelho vem primeiro — no
 * desktop a ordem é indiferente e mantemos as duas lado a lado.
 */
export function BotoesLoja({ tamanho = "grande" }: { tamanho?: "grande" | "pequeno" }) {
  const plataforma = useSyncExternalStore(naoMuda, lerPlataforma, () => null);

  const altura = tamanho === "grande" ? 56 : 44;

  const lojas = [
    {
      chave: "ios" as const,
      href: LINK_IOS,
      src: "/AppleStore.svg",
      alt: "Baixar na App Store",
      largura: altura * 3.0,
    },
    {
      chave: "android" as const,
      href: LINK_ANDROID,
      src: "/GooglePlay.svg",
      alt: "Disponível no Google Play",
      largura: altura * 3.37,
    },
  ];

  // A loja do aparelho vai para a frente; sem detecção, mantém a ordem original.
  const ordenadas =
    plataforma === null
      ? lojas
      : [...lojas].sort((a) => (a.chave === plataforma ? -1 : 1));

  return (
    <div className="flex flex-wrap items-center gap-3">
      {ordenadas.map((loja) => (
        <a
          key={loja.chave}
          href={loja.href}
          target="_blank"
          rel="noopener noreferrer"
          className="ease-suave inline-block transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
        >
          <Image
            src={loja.src}
            alt={loja.alt}
            width={loja.largura}
            height={altura}
            style={{ height: altura, width: "auto" }}
          />
        </a>
      ))}
    </div>
  );
}
