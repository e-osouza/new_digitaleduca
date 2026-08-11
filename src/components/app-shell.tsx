"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Marca } from "@/components/marca";
import { BotaoSair } from "@/components/botao-sair";
import { BuscaRapida } from "@/components/busca-rapida";
import type { GrupoNav } from "@/lib/nav";

const CHAVE_RECOLHIDO = "de:menu-recolhido";

/*
 * A preferência de menu recolhido vive no localStorage — uma fonte externa ao
 * React. Lê-la num efeito causaria render em cascata (e o servidor não tem
 * acesso a ela), então usamos uma pequena store com useSyncExternalStore: o
 * servidor renderiza sempre expandido e o cliente sincroniza na hidratação.
 */
const ouvintes = new Set<() => void>();

function assinarRecolhido(aoMudar: () => void) {
  ouvintes.add(aoMudar);
  // 'storage' cobre a mudança feita em outra aba.
  window.addEventListener("storage", aoMudar);
  return () => {
    ouvintes.delete(aoMudar);
    window.removeEventListener("storage", aoMudar);
  };
}

function lerRecolhido() {
  return window.localStorage.getItem(CHAVE_RECOLHIDO) === "1";
}

function gravarRecolhido(valor: boolean) {
  window.localStorage.setItem(CHAVE_RECOLHIDO, valor ? "1" : "0");
  for (const ouvinte of ouvintes) ouvinte();
}

const GRUPOS: GrupoNav[] = [
  {
    titulo: null,
    itens: [
      {
        href: "/inicio",
        rotulo: "Início",
        icone: (
          <>
            <path d="M3 8.5 10 3l7 5.5" />
            <path d="M5 8.5V16a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8.5" />
          </>
        ),
      },
      {
        href: "/buscar",
        rotulo: "Explorar",
        icone: (
          <>
            <circle cx="9" cy="9" r="5.5" />
            <path d="m13.5 13.5 3.5 3.5" />
          </>
        ),
      },
    ],
  },
  {
    titulo: "Conteúdos",
    itens: [
      {
        href: "/tipo/aula",
        rotulo: "Aulas",
        icone: (
          <>
            <path d="M10 4 3 7.5 10 11l7-3.5L10 4Z" />
            <path d="M6 9.5V14c0 1.1 1.8 2 4 2s4-.9 4-2V9.5" />
          </>
        ),
      },
      {
        href: "/tipo/palestra",
        rotulo: "Palestras",
        icone: (
          <>
            <rect x="3" y="4" width="14" height="9" rx="1.5" />
            <path d="M7 16.5h6M10 13v3.5" />
          </>
        ),
      },
      {
        href: "/tipo/podcast",
        rotulo: "Podcasts",
        icone: (
          <>
            <rect x="7.5" y="2.5" width="5" height="9" rx="2.5" />
            <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5" />
          </>
        ),
      },
    ],
  },
  {
    titulo: "Meu percurso",
    itens: [
      {
        href: "/trilhas",
        rotulo: "Trilhas",
        icone: (
          <>
            <circle cx="5" cy="5" r="2" />
            <circle cx="15" cy="15" r="2" />
            <path d="M7 5h4a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h4" />
          </>
        ),
      },
      {
        href: "/minha-lista",
        rotulo: "Minha lista",
        icone: (
          <>
            <path d="M5.5 3h9a1 1 0 0 1 1 1v13l-5.5-3.5L4.5 17V4a1 1 0 0 1 1-1Z" />
          </>
        ),
      },
      {
        href: "/meus-conteudos",
        rotulo: "Continuar assistindo",
        icone: (
          <>
            <circle cx="10" cy="10" r="7.5" />
            <path d="M10 5.5V10l3 1.8" />
          </>
        ),
      },
    ],
  },
  {
    titulo: "Conta",
    itens: [
      {
        href: "/planos",
        rotulo: "Planos",
        icone: (
          <>
            <path d="M2.5 7.5h15M2.5 7.5A1.5 1.5 0 0 1 4 6h12a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5v-7Z" />
            <path d="M5.5 12h3" />
          </>
        ),
      },
      {
        href: "/conta",
        rotulo: "Configurações",
        icone: (
          <>
            <circle cx="10" cy="10" r="2.5" />
            <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7" />
          </>
        ),
      },
    ],
  },
];

export function AppShell({
  nome,
  email,
  children,
}: {
  nome: string | null;
  email: string | null;
  children: React.ReactNode;
}) {
  const caminho = usePathname();
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const recolhido = useSyncExternalStore(
    assinarRecolhido,
    lerRecolhido,
    () => false,
  );

  // Esc fecha a gaveta; enquanto aberta, o fundo não rola.
  useEffect(() => {
    if (!gavetaAberta) return;

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setGavetaAberta(false);
    }

    document.addEventListener("keydown", aoTeclar);
    document.body.dataset.gaveta = "aberta";

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      delete document.body.dataset.gaveta;
    };
  }, [gavetaAberta]);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* ---------- menu lateral fixo (lg+) ---------- */}
      <Navegacao
        caminho={caminho}
        nome={nome}
        email={email}
        recolhido={recolhido}
        aoAlternarRecolhido={() => gravarRecolhido(!recolhido)}
        className={`border-borda-suave bg-cromo ease-saida hidden shrink-0 border-r transition-[width] duration-300 lg:flex ${
          recolhido ? "w-[4.5rem]" : "w-64 xl:w-72"
        }`}
      />

      {/*
        Gaveta do mobile. Fica sempre montada e apenas deslizando: assim a
        transição acontece nos dois sentidos, sem depender de desmontagem.
      */}
      <div className="pointer-events-none fixed inset-0 z-50 lg:hidden">
        <button
          type="button"
          tabIndex={gavetaAberta ? 0 : -1}
          aria-label="Fechar menu"
          onClick={() => setGavetaAberta(false)}
          className={`bg-fundo/75 absolute inset-0 backdrop-blur-sm transition-opacity duration-300 ${
            gavetaAberta ? "pointer-events-auto opacity-100" : "opacity-0"
          }`}
        />

        <Navegacao
          caminho={caminho}
          nome={nome}
          email={email}
          inerte={!gavetaAberta}
          aoNavegar={() => setGavetaAberta(false)}
          className={`border-borda-suave bg-cromo ease-saida relative flex h-full w-[min(19rem,85vw)] border-r shadow-2xl transition-transform duration-300 ${
            gavetaAberta ? "pointer-events-auto translate-x-0" : "-translate-x-full"
          }`}
        />
      </div>

      {/* ---------- área principal ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-borda-suave bg-cromo/80 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur-md sm:h-16 sm:gap-3 sm:px-5 lg:px-6">
          <button
            type="button"
            onClick={() => setGavetaAberta(true)}
            aria-label="Abrir menu"
            aria-expanded={gavetaAberta}
            className="text-texto-2 hover:text-texto hover:bg-superficie-2 active:bg-borda-suave flex h-11 w-11 items-center justify-center rounded-lg transition-colors lg:hidden"
          >
            <IconeMenu />
          </button>

          <Link
            href="/inicio"
            className="flex h-11 items-center px-1 lg:hidden"
            aria-label="Início"
          >
            <Marca altura={20} />
          </Link>

          {/* Sair vive apenas no rodapé do menu lateral, para não duplicar. */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <BuscaRapida />
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Navegacao({
  caminho,
  nome,
  email,
  className,
  aoNavegar,
  inerte = false,
  recolhido = false,
  aoAlternarRecolhido,
}: {
  caminho: string;
  nome: string | null;
  email: string | null;
  className: string;
  /** Só a gaveta do mobile precisa reagir: navegar deve fechá-la. */
  aoNavegar?: () => void;
  /** Tira a gaveta fechada da ordem de foco e dos leitores de tela. */
  inerte?: boolean;
  /** Modo trilha de ícones — só no menu fixo do desktop. */
  recolhido?: boolean;
  aoAlternarRecolhido?: () => void;
}) {
  return (
    <aside className={`flex-col ${className}`} inert={inerte}>
      <div
        className={`border-borda-suave flex h-14 shrink-0 items-center border-b sm:h-16 ${
          recolhido ? "justify-center px-2" : "gap-2 px-4 sm:px-5"
        }`}
      >
        {!recolhido && (
          <Link
            href="/inicio"
            onClick={aoNavegar}
            className="flex h-11 min-w-0 items-center"
            aria-label="Início — Digital Educa"
          >
            <Marca altura={24} />
          </Link>
        )}

        {aoAlternarRecolhido && (
          <button
            type="button"
            onClick={aoAlternarRecolhido}
            aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
            title={recolhido ? "Expandir menu" : "Recolher menu"}
            className="text-texto-3 hover:text-texto hover:bg-superficie-2 ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
          >
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className={`ease-saida h-5 w-5 transition-transform duration-300 ${
                recolhido ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5.5 7.5 10l4.5 4.5" />
              <path d="M4 4v12" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto p-3">
        {GRUPOS.map((grupo, indiceGrupo) => (
          <div key={grupo.titulo ?? `grupo-${indiceGrupo}`} className="flex flex-col gap-1">
            {grupo.titulo && !recolhido && (
              <h2 className="text-texto-3 px-3 pt-1 pb-1 text-[10px] font-semibold tracking-[0.12em] uppercase">
                {grupo.titulo}
              </h2>
            )}
            {grupo.titulo && recolhido && (
              <span aria-hidden="true" className="bg-borda-suave mx-3 my-1 h-px" />
            )}

            {grupo.itens.map((item) => {
              const ativo =
                caminho === item.href || caminho.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={aoNavegar}
                  aria-current={ativo ? "page" : undefined}
                  title={recolhido ? item.rotulo : undefined}
                  className={`group relative flex min-h-11 items-center rounded-lg text-sm font-medium transition-colors duration-200 ${
                    recolhido ? "justify-center px-0" : "gap-3 px-3"
                  } py-2.5 ${
                    ativo
                      ? "bg-acento/12 text-acento"
                      : "text-texto-2 hover:bg-superficie-2 hover:text-texto active:bg-borda-suave"
                  }`}
                >
                  {/* Marcador do item ativo, crescendo a partir do centro. */}
                  <span
                    aria-hidden="true"
                    className={`bg-acento absolute top-1/2 left-0 w-0.5 -translate-y-1/2 rounded-r-full transition-all duration-300 ${
                      ativo ? "h-6 opacity-100" : "h-0 opacity-0"
                    }`}
                  />
                  <svg
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {item.icone}
                  </svg>
                  {!recolhido && <span className="truncate">{item.rotulo}</span>}
                  {recolhido && <span className="sr-only">{item.rotulo}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-borda-suave flex shrink-0 flex-col gap-3 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
        {(nome || email) && (
          <Link
            href="/conta"
            onClick={aoNavegar}
            title={recolhido ? (nome ?? email ?? "Conta") : undefined}
            className={`hover:bg-superficie-2 flex items-center rounded-lg transition-colors ${
              recolhido ? "justify-center p-1" : "gap-3 p-1"
            }`}
          >
            <span className="bg-acento/15 text-acento flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              {(nome ?? email ?? "?").charAt(0).toUpperCase()}
            </span>
            {!recolhido && (
              <span className="flex min-w-0 flex-col">
                {nome && (
                  <span className="truncate text-sm font-semibold">{nome}</span>
                )}
                {email && (
                  <span className="text-texto-3 truncate text-xs">{email}</span>
                )}
              </span>
            )}
          </Link>
        )}
        <BotaoSair compacto={recolhido} />
      </div>
    </aside>
  );
}

function IconeMenu() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 5.5h14M3 10h14M3 14.5h14" strokeLinecap="round" />
    </svg>
  );
}
