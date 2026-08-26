import Image from "next/image";
import type { ReactNode } from "react";
import { Marca } from "@/components/marca";
import {
  DESCRICOES_DE_TIPO,
  ROTULOS_PLURAIS,
  SITE_INSTITUCIONAL,
} from "@/lib/nav";

/** O que o painel anuncia. É o acervo real, sem promessa que a plataforma não cumpra. */
/*
 * O que a plataforma oferece, na MESMA ordem e com as MESMAS palavras do menu.
 *
 * Os textos vêm de `nav.ts` de propósito. Escritos à mão aqui, eles
 * envelheceram: esta tela anunciou "Aulas e cursos" e "Palestras" por um bom
 * tempo depois de o produto ter virado Cursos, Trilhas, MasterClass e
 * Podcasts — a primeira coisa que um visitante lia era um catálogo que ele não
 * ia encontrar do outro lado do login.
 *
 * Trilha é a única linha escrita aqui: ela não é um tipo de conteúdo, é a
 * costura entre eles, e por isso não tem verbete em `DESCRICOES_DE_TIPO`.
 */
const OFERTA = [
  { titulo: ROTULOS_PLURAIS.CURSO, texto: DESCRICOES_DE_TIPO.CURSO },
  {
    titulo: "Trilhas",
    texto: "Uma sequência montada para o seu objetivo, no seu ritmo.",
  },
  { titulo: ROTULOS_PLURAIS.AULA, texto: DESCRICOES_DE_TIPO.AULA },
  { titulo: ROTULOS_PLURAIS.PODCAST, texto: DESCRICOES_DE_TIPO.PODCAST },
];

/**
 * Moldura das telas de acesso: entrar, criar conta e recuperar senha.
 *
 * Um cartão único pousado sobre o fundo, com o painel da marca embutido nele —
 * e não duas metades coladas de ponta a ponta na janela. A diferença é o ar em
 * volta: a tela passa a ter uma peça no centro, em vez de dois blocos que se
 * encostam no meio e vazam pelas bordas.
 *
 * O painel fica à ESQUERDA, onde o olho começa: ele é o que explica o que há
 * do outro lado do login. Abaixo de `lg` ele some — não cabem duas colunas, e
 * aí o formulário é a única coisa que importa.
 *
 * O painel usa cores fixas, e não os tokens do tema: ele é sempre o navy da
 * marca, então o texto em cima precisa ser sempre claro. Com tokens, o tema
 * escuro inverteria as intenções e apagaria o conteúdo.
 */
export function MolduraAcesso({
  titulo,
  descricao,
  aviso,
  children,
}: {
  titulo: string;
  descricao: string;
  /** Mensagem em destaque acima do formulário, como a de sessão expirada. */
  aviso?: ReactNode;
  children: ReactNode;
}) {
  return (
    /*
      A tela inteira é o cartão: encosta nas quatro bordas, sem margem nem
      fundo aparecendo em volta. O respiro é padding — a borda de papel que
      separa o painel navy do limite da janela.

      `flex-1` daqui até o miolo é o que leva a altura até embaixo; sem isso
      tudo encolhia para a altura do formulário.
    */
    <div className="bg-superficie flex min-h-dvh flex-col p-3 sm:p-4">
      <div className="flex flex-1 flex-col">
        <div className="grid flex-1 items-stretch lg:grid-cols-2">
          <aside className="bg-brand relative hidden overflow-hidden rounded-[1.5rem] lg:flex lg:flex-col lg:justify-between lg:gap-10 lg:p-10 xl:p-14">
            {/* Brilho difuso atrás do conteúdo, para o navy não ficar chapado. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#0093e6]/25 blur-3xl"
            />

            {/*
              O logotipo branco direto do arquivo, e não o componente `Marca`:
              aqui o fundo é sempre navy, então a troca por tema que a `Marca`
              faz só serviria para apagar a arte no tema claro.
            */}
            <a
              href={SITE_INSTITUCIONAL}
              className="relative w-fit rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <Image
                src="/logo/de-branca.svg"
                alt="Digital Educa"
                width={97}
                height={32}
                priority
              />
            </a>

            <div className="relative flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <p className="font-display text-2xl leading-tight font-semibold text-balance text-white xl:text-3xl">
                  Conteúdo que você usa na próxima reunião.
                </p>
                {/*
                  Duas exigências, e as duas vieram de erro anterior:
                  1. Servir às TRÊS telas — entrar, criar conta e recuperar
                     senha. A frase antiga dizia "Entre para continuar de onde
                     parou", o que soava errado para quem estava criando a
                     primeira conta.
                  2. Não repetir os itens abaixo. "Com quem já escalou
                     empresas" já é o texto de MasterClass, e dizer o mesmo
                     duas vezes na mesma tela gasta a única frase que temos.
                */}
                <p className="max-w-md leading-relaxed text-white/70">
                  Comece numa tela e continue em outra: o seu progresso
                  acompanha você no navegador e no aplicativo.
                </p>
              </div>

              <ul className="flex flex-col gap-4">
                {OFERTA.map((item) => (
                  <li key={item.titulo} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15"
                    >
                      <svg
                        viewBox="0 0 20 20"
                        className="h-3 w-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m4.5 10.5 3.5 3.5 7.5-8" />
                      </svg>
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-semibold text-white">{item.titulo}</p>
                      <p className="max-w-sm text-sm leading-snug text-white/60">
                        {item.texto}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <p className="relative text-xs text-white/40">
              © {new Date().getFullYear()} Digital Educa. Todos os direitos
              reservados.
            </p>
          </aside>

          <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 sm:py-14 lg:px-12 xl:px-16">
            <div className="flex w-full max-w-md flex-col gap-7">
              {/*
                No desktop o logotipo já está no painel; repeti-lo aqui seria
                dizer a mesma coisa duas vezes na mesma tela. Abaixo de `lg`,
                onde o painel não existe, ele volta — e aí segue o tema, porque
                o fundo também segue.
              */}
              <a
                href={SITE_INSTITUCIONAL}
                className="focus-visible:outline-acento w-fit rounded focus-visible:outline-2 focus-visible:outline-offset-4 lg:hidden"
                aria-label="Digital Educa"
              >
                <Marca altura={30} />
              </a>

              <div className="flex flex-col gap-2">
                <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  {titulo}
                </h1>
                <p className="text-texto-3 text-sm">{descricao}</p>
              </div>

              {aviso}

              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
