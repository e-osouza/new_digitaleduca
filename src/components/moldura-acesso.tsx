import type { ReactNode } from "react";
import { Marca } from "@/components/marca";
import { SITE_INSTITUCIONAL } from "@/lib/nav";

/** O que o painel anuncia. É o acervo real, sem promessa que a plataforma não cumpra. */
const OFERTA = [
  {
    titulo: "Aulas e cursos",
    texto: "Conteúdo em módulos, para aplicar no dia a dia do negócio.",
  },
  {
    titulo: "Palestras",
    texto: "Replays de quem já escalou empresas.",
  },
  {
    titulo: "Podcasts",
    texto: "Conversas com especialistas, para ouvir enquanto você faz outra coisa.",
  },
  {
    titulo: "Trilhas",
    texto: "Uma sequência montada para o seu objetivo, no seu ritmo.",
  },
];

/**
 * Moldura das telas de acesso: entrar, criar conta e recuperar senha.
 *
 * Tela dividida — formulário à esquerda, painel da marca à direita. O painel
 * some abaixo de `lg`, onde a largura não comporta duas colunas e o formulário
 * é a única coisa que importa.
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
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex min-h-dvh items-center justify-center px-5 py-12 sm:px-8 sm:py-16 lg:min-h-0">
        <div className="flex w-full max-w-sm flex-col gap-7">
          {/*
            Aqui o fundo segue o tema, então vale o componente `Marca`, que
            troca a arte clara pela escura sozinho — a versão branca fixa do
            painel ficaria invisível no tema claro.

            É também o caminho de volta ao institucional, agora que o cabeçalho
            saiu desta tela.
          */}
          <a
            href={SITE_INSTITUCIONAL}
            className="focus-visible:outline-acento w-fit rounded focus-visible:outline-2 focus-visible:outline-offset-4"
            aria-label="Digital Educa"
          >
            <Marca altura={30} />
          </a>

          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              {titulo}
            </h1>
            <p className="text-texto-3 text-sm">{descricao}</p>
          </div>

          {aviso}

          {children}
        </div>
      </div>

      <aside className="bg-brand relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-center">
        {/* Brilho difuso atrás do conteúdo, para o navy não ficar chapado. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#0093e6]/25 blur-3xl"
        />

        <div className="relative flex flex-col gap-10 px-12 py-16 xl:px-16">
          <div className="flex flex-col gap-2">
            <p className="font-display text-2xl leading-tight font-semibold text-balance text-white xl:text-3xl">
              Educação corporativa para aplicar amanhã.
            </p>
            <p className="max-w-md leading-relaxed text-white/70">
              Entre para continuar de onde parou — o progresso acompanha você no
              navegador e no aplicativo.
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
      </aside>
    </div>
  );
}
