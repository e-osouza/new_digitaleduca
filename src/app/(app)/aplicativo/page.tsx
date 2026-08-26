import type { Metadata } from "next";
import Image from "next/image";
import { FAIXA } from "@/lib/ui";
import { BotoesLoja } from "@/components/botoes-loja";

export const metadata: Metadata = { title: "Baixe o app" };

/**
 * O aplicativo, visto de dentro da plataforma.
 *
 * Esta página morava em `(site)`, o layout público que sobrou de quando o
 * institucional ficava neste projeto. Quem clicava em "Baixe o app" no menu
 * perdia o menu lateral, ganhava um cabeçalho de visitante e um rodapé de
 * site — e a sensação era de ter saído da plataforma no meio da sessão, com
 * direito a um "Já tem conta? É só entrar" oferecido a quem estava logado.
 *
 * Aqui dentro o texto muda de dono: não é uma página de venda para
 * desconhecido, é o recado para quem já usa a plataforma e vai levá-la para o
 * celular. Nada de "sua conta e seu progresso são os mesmos" no futuro — é a
 * conta DELA, e o progresso dela.
 */
const VANTAGENS = [
  {
    titulo: "Continue de onde parou",
    texto:
      "O seu progresso é o mesmo nos dois. Comece a aula no computador e termine no ônibus.",
    icone: (
      <>
        <circle cx="10" cy="10" r="7.5" />
        <path d="M10 5.5V10l3 1.8" />
      </>
    ),
  },
  {
    titulo: "Ouça como podcast",
    texto:
      "Boa parte do acervo funciona bem só no áudio — dá para acompanhar dirigindo ou caminhando.",
    icone: (
      <>
        <rect x="7.5" y="2.5" width="5" height="9" rx="2.5" />
        <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5" />
      </>
    ),
  },
  {
    titulo: "Avisos de conteúdo novo",
    texto:
      "Uma notificação quando entrar conteúdo novo na sua área de interesse.",
    icone: (
      <>
        <path d="M10 3a5 5 0 0 0-5 5v3l-1.5 2.5h13L15 11V8a5 5 0 0 0-5-5Z" />
        <path d="M8 16.5a2 2 0 0 0 4 0" />
      </>
    ),
  },
];

export default function Aplicativo() {
  return (
    <div className={`${FAIXA} flex flex-col gap-6 py-8 sm:gap-8 sm:py-10`}>
      <header className="flex flex-col gap-1.5 sm:gap-2">
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Baixe o app
        </h1>
        <p className="text-texto-3 text-sm">
          A mesma conta, o mesmo progresso — no bolso.
        </p>
      </header>

      {/*
        O cartão de abertura repete a linguagem do cabeçalho do Club: brilho
        diagonal do acento e cantos grandes. É o que dá presença à página sem
        trazer de volta o tom de landing.
      */}
      <section className="border-borda-suave bg-superficie relative overflow-hidden rounded-3xl border shadow-sm">
        <div
          aria-hidden="true"
          className="from-acento/12 via-acento/4 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent"
        />

        <div className="relative grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:p-10">
          <div className="flex flex-col items-start gap-5">
            <span className="text-texto-3 text-[11px] font-semibold tracking-[0.14em] uppercase">
              Android e iOS
            </span>

            <h2 className="font-display text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
              Leve o Digital Educa <span className="text-acento">no bolso</span>
            </h2>

            <p className="text-texto-2 max-w-lg leading-relaxed">
              Assista às aulas, às MasterClass e ouça os podcasts de onde
              estiver. Você entra com o mesmo e-mail e senha daqui — não precisa
              criar nada novo.
            </p>

            <BotoesLoja />

            <p className="text-texto-3 text-sm">
              Grátis para baixar. O acesso ao acervo segue a sua assinatura.
            </p>
          </div>

          {/* A arte do foguete, a mesma que a plataforma já usa em outros lugares. */}
          <div className="mx-auto w-full max-w-[15rem] lg:max-w-xs">
            <Image
              src="/rocket_img.png"
              alt=""
              width={720}
              height={720}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {VANTAGENS.map((vantagem) => (
          <div
            key={vantagem.titulo}
            className="border-borda-suave bg-superficie flex flex-col gap-3 rounded-2xl border p-5 shadow-sm"
          >
            <span className="bg-acento/12 text-acento flex h-11 w-11 items-center justify-center rounded-xl">
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {vantagem.icone}
              </svg>
            </span>
            <h3 className="font-display text-base font-semibold">
              {vantagem.titulo}
            </h3>
            <p className="text-texto-2 text-sm leading-relaxed">
              {vantagem.texto}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
