import type { Metadata } from "next";
import Image from "next/image";
import { BotoesLoja } from "@/components/botoes-loja";

export const metadata: Metadata = {
  title: "Baixe o aplicativo",
  description:
    "Leve suas aulas, palestras e podcasts no bolso. Aplicativo Digital Educa para Android e iOS.",
};

const VANTAGENS = [
  {
    titulo: "Continue de onde parou",
    texto:
      "O progresso é o mesmo no celular e no navegador. Comece a aula no computador e termine no ônibus.",
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
      "Receba uma notificação quando entrar uma aula nova na sua área de interesse.",
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
    <div className="flex flex-col">
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="aura-acento pointer-events-none absolute inset-x-0 top-0 h-[480px]"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pt-16 pb-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pt-24 lg:pb-24">
          <div className="flex flex-col items-start gap-6">
            <span className="text-acento text-xs font-semibold tracking-wider uppercase">
              Android e iOS
            </span>

            <h1 className="font-display text-3xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">
              Leve o Digital Educa <span className="text-acento">no bolso</span>
            </h1>

            <p className="text-texto-2 max-w-lg leading-relaxed sm:text-lg">
              Baixe o aplicativo e assista às aulas, palestras e podcasts de
              onde estiver. Sua conta e seu progresso são os mesmos da web.
            </p>

            <BotoesLoja />

            <p className="text-texto-3 text-sm">
              Grátis para baixar. O acesso ao acervo segue a sua assinatura.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-xs lg:max-w-sm">
            {/* A arte do foguete já é usada na landing e mantém a linguagem visual. */}
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

      <section className="border-borda-suave border-y">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:grid-cols-3 sm:px-8 lg:px-10">
          {VANTAGENS.map((vantagem) => (
            <div key={vantagem.titulo} className="flex flex-col gap-3">
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
              <h2 className="font-display text-base font-semibold">
                {vantagem.titulo}
              </h2>
              <p className="text-texto-2 text-sm leading-relaxed">
                {vantagem.texto}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-5 py-16 text-center sm:px-8 lg:px-10">
        <h2 className="font-display text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
          Já tem conta? É só entrar
        </h2>
        <p className="text-texto-2 max-w-lg">
          Use o mesmo e-mail e senha da plataforma. Não precisa criar nada novo.
        </p>
        <BotoesLoja tamanho="pequeno" />
      </section>
    </div>
  );
}
