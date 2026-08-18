"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Propaganda } from "@/types/api";

/**
 * Banners de propaganda cadastrados pelo admin. Um banner só aparece como
 * imagem clicável; vários viram um carrossel que gira sozinho, com indicadores.
 */
export function Propagandas({ itens }: { itens: Propaganda[] }) {
  const [atual, setAtual] = useState(0);
  const total = itens.length;

  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(() => setAtual((a) => (a + 1) % total), 6000);
    return () => clearInterval(t);
  }, [total]);

  if (total === 0) return null;

  return (
    /*
     * `calha` é a mesma calha lateral dos trilhos abaixo — sem ela o banner
     * encostava nas duas paredes. O herói ACIMA é sangrado de propósito (a
     * foto ocupa a largura toda e só o texto recebe calha), e este bloco
     * acabou herdando esse comportamento sem ser um herói: aqui a arte mora
     * dentro de um cartão arredondado, que precisa da borda para existir.
     */
    <section aria-label="Destaques" className="calha flex w-full flex-col gap-2">
      <div className="border-borda-suave bg-superficie-2 relative overflow-hidden rounded-2xl border">
        <div
          className="ease-suave flex transition-transform duration-500"
          style={{ transform: `translateX(-${atual * 100}%)` }}
        >
          {itens.map((p) => {
            const externo = /^https?:\/\//i.test(p.link);
            return (
              <a
                key={p.id}
                href={p.link}
                {...(externo
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="relative block h-40 w-full shrink-0 sm:h-48 lg:h-56"
                title={p.titulo ?? undefined}
              >
                <Image
                  src={p.imagem}
                  alt={p.titulo ?? ""}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority
                />
              </a>
            );
          })}
        </div>

        {total > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {itens.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAtual(i)}
                aria-label={`Ir ao destaque ${i + 1}`}
                className={`h-2 rounded-full shadow transition-all ${
                  i === atual ? "w-5 bg-white" : "w-2 bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
