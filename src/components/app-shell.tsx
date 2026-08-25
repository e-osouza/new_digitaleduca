"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Marca, MarcaIcone } from "@/components/marca";
import { BotaoSair } from "@/components/botao-sair";
import { BuscaRapida } from "@/components/busca-rapida";
import { ROTULOS_PLURAIS, type GrupoNav } from "@/lib/nav";
import { Notificacoes } from "@/components/notificacoes";

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
    titulo: "Para você",
    itens: [
      /*
       * A ordem é a do produto, não a do acervo: curso primeiro porque é o
       * compromisso mais longo, trilha em seguida porque organiza o resto, e
       * MasterClass e podcast como consumo avulso.
       *
       * Os rótulos vêm de `ROTULOS_PLURAIS`, e não escritos aqui: "MasterClass"
       * é nome de PRODUTO sobre o tipo `AULA`, que é contrato de API e viaja
       * para o app mobile já instalado. Duplicar o texto foi o que tornou
       * arriscada a troca anterior de "Aula" por "MasterClass" no painel.
       */
      {
        href: "/cursos",
        rotulo: ROTULOS_PLURAIS.CURSO,
        icone: (
          <>
            <path d="M4 4.5h9a2 2 0 0 1 2 2v9H6a2 2 0 0 1-2-2v-9Z" />
            <path d="M4 13.5a2 2 0 0 1 2-2h9" />
            <path d="M7.5 7.5h4" />
          </>
        ),
      },
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
        href: "/masterclass",
        rotulo: ROTULOS_PLURAIS.AULA,
        icone: (
          <>
            <path d="M10 4 3 7.5 10 11l7-3.5L10 4Z" />
            <path d="M6 9.5V14c0 1.1 1.8 2 4 2s4-.9 4-2V9.5" />
          </>
        ),
      },
      {
        href: "/podcast",
        rotulo: ROTULOS_PLURAIS.PODCAST,
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
        href: "/listas",
        rotulo: "Minhas listas",
        icone: (
          <>
            <path d="M4 5h8" />
            <path d="M4 10h8" />
            <path d="M4 15h5" />
            <circle cx="15.5" cy="14.5" r="2.2" />
          </>
        ),
      },
      {
        href: "/salvos",
        rotulo: "Salvos",
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
        href: "/perfil",
        rotulo: "Meu perfil",
        icone: (
          <>
            <circle cx="10" cy="6.5" r="3" />
            <path d="M3.5 17c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" />
          </>
        ),
      },
      {
        /*
          Só aparece para quem tem papel CLUB — ver `gruposPara`. Fica coloado
          em "Meu perfil" porque é da mesma natureza: administrar a própria
          conta, e não navegar pelo acervo.
        */
        href: "/club",
        rotulo: "Digital Club",
        icone: (
          /*
            Diamante lapidado, não losango: o contorno mais a cintura e o V das
            facetas são o que faz a forma ser lida como pedra. Só o losango
            viraria naipe de baralho neste tamanho.
          */
          <>
            <path d="M6.5 3h7l3.5 4.5L10 17.3 3 7.5z" />
            <path d="M3 7.5h14" />
            <path d="M6.5 3 10 7.5 13.5 3" />
          </>
        ),
      },
      {
        href: "/estatisticas",
        rotulo: "Estatísticas",
        icone: (
          <>
            <path d="M3 17V9M8 17V4M13 17v-6M18 17V7" />
          </>
        ),
      },
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
      /*
       * O app saiu do cabeçalho e virou item de menu. É o único destino daqui
       * que mora no site institucional, fora da moldura logada — clicar leva
       * para o layout público, e por isso ele fica no fim da lista, depois de
       * tudo que é da plataforma.
       */
      {
        href: "/aplicativo",
        rotulo: "Baixe o app",
        icone: (
          <>
            <rect x="6" y="2.5" width="8" height="15" rx="2" />
            <path d="M9 15.2h2" />
          </>
        ),
      },
    ],
  },
];

/**
 * O menu de quem está vendo.
 *
 * O Club é o único item condicional: administrar um time só faz sentido para
 * quem tem o papel. Filtrar aqui, e não esconder com CSS, mantém o item fora
 * também da ordem de foco e dos leitores de tela.
 */
function gruposPara(ehClub: boolean): GrupoNav[] {
  if (ehClub) return GRUPOS;

  return GRUPOS.map((grupo) => ({
    ...grupo,
    itens: grupo.itens.filter((item) => item.href !== "/club"),
  }));
}

/**
 * Href do item que representa a página atual — no máximo um, já que nenhuma
 * rota do menu é prefixo de outra. O marcador deslizante precisa desse valor
 * único: ele é um elemento só, e não uma marca por item.
 */
function acharAtivo(caminho: string, ehClub: boolean) {
  for (const grupo of gruposPara(ehClub)) {
    for (const item of grupo.itens) {
      if (caminho === item.href || caminho.startsWith(`${item.href}/`)) {
        return item.href;
      }
    }
  }
  return null;
}

/*
 * O marcador é medido ANTES da pintura, senão ele aparece um quadro fora do
 * lugar. No servidor não há layout para medir — e o React avisa se
 * useLayoutEffect roda lá —, então ali caímos no useEffect, que nunca chega a
 * executar durante a renderização do servidor.
 */
const useEfeitoDeLayout =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function AppShell({
  nome,
  email,
  avatar,
  saudacao,
  ehClub = false,
  children,
}: {
  nome: string | null;
  email: string | null;
  avatar: string | null;
  /** Já resolvida no servidor — ver `lib/saudacao`. */
  saudacao: { texto: string; periodo: "dia" | "noite" };
  /** Papel CLUB: só então o menu mostra o painel do time. */
  ehClub?: boolean;
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
        avatar={avatar}
        ehClub={ehClub}
        recolhido={recolhido}
        aoAlternarRecolhido={() => gravarRecolhido(!recolhido)}
        /*
          z-40 para ficar ACIMA do cabeçalho (z-30): o botão de recolher mora
          na borda direita desta barra e avança sobre a faixa do cabeçalho —
          com a ordem invertida, metade dele sumia por baixo.
        */
        className={`border-borda-suave bg-cromo ease-saida relative z-40 hidden shrink-0 border-r transition-[width] duration-300 lg:flex ${
          recolhido ? "w-[4.5rem]" : "w-60 xl:w-64"
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
          avatar={avatar}
          ehClub={ehClub}
          inerte={!gavetaAberta}
          aoNavegar={() => setGavetaAberta(false)}
          className={`border-borda-suave bg-cromo ease-saida relative flex h-full w-[min(19rem,85vw)] border-r shadow-2xl transition-transform duration-300 ${
            gavetaAberta ? "pointer-events-auto translate-x-0" : "-translate-x-full"
          }`}
        />
      </div>

      {/* ---------- área principal ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/*
          `relative z-30` existe por causa do painel do sino, que escapa da
          faixa do cabeçalho. O `backdrop-blur` já fazia deste header um
          contexto de empilhamento próprio, e como o <main> vem depois dele no
          DOM, o conteúdo da página pintava por cima de qualquer coisa que
          transbordasse daqui — o painel aparecia cortado na borda de baixo.

          Fica entre os dois vizinhos: acima do conteúdo, abaixo da barra
          lateral (z-40, pelo botão de recolher) e da gaveta do menu (z-50).
        */}
        <header className="border-borda-suave bg-cromo/80 relative z-30 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur-md sm:h-16 sm:gap-3 sm:px-5 lg:px-6">
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

          {/*
            Só a partir de `lg`: abaixo disso o cabeçalho já tem o botão do
            menu, a marca, a busca e o sino, e a saudação espremeria todos.
            Ali o menu lateral não existe, então a esquerda está ocupada.
          */}
          <p className="text-texto hidden items-center gap-2 truncate text-base font-semibold lg:flex">
            <IconeSaudacao periodo={saudacao.periodo} />
            {saudacao.texto}
          </p>

          {/* Sair vive apenas no rodapé do menu lateral, para não duplicar. */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <BuscaRapida />

            <Notificacoes />
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain">
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
  avatar,
  ehClub = false,
  className,
  aoNavegar,
  inerte = false,
  recolhido = false,
  aoAlternarRecolhido,
}: {
  caminho: string;
  nome: string | null;
  email: string | null;
  avatar: string | null;
  /** Papel CLUB: adiciona o item do painel do time. */
  ehClub?: boolean;
  className: string;
  /** Só a gaveta do mobile precisa reagir: navegar deve fechá-la. */
  aoNavegar?: () => void;
  /** Tira a gaveta fechada da ordem de foco e dos leitores de tela. */
  inerte?: boolean;
  /** Modo trilha de ícones — só no menu fixo do desktop. */
  recolhido?: boolean;
  aoAlternarRecolhido?: () => void;
}) {
  const ativo = acharAtivo(caminho, ehClub);
  const navRef = useRef<HTMLElement | null>(null);
  const itensRef = useRef(new Map<string, HTMLAnchorElement>());
  const [marcador, setMarcador] = useState<{
    x: number;
    y: number;
    largura: number;
    altura: number;
  } | null>(null);

  /*
   * Posição do fundo do item ativo. Medimos o próprio link em vez de calcular
   * a altura pela contagem de itens: os grupos têm títulos que somem no modo
   * recolhido, e um rótulo pode crescer.
   *
   * O ResizeObserver cobre o que não passa por este efeito — a animação de
   * largura ao recolher, a troca de breakpoint e o instante em que o menu sai
   * de `display:none` (no celular ele nasce escondido e mede zero).
   */
  useEfeitoDeLayout(() => {
    const nav = navRef.current;
    const alvo = ativo ? itensRef.current.get(ativo) : null;
    if (!nav || !alvo) return;

    function medir() {
      // Escondido, o link mede zero; guardar isso jogaria o marcador no canto.
      if (!alvo || !alvo.offsetHeight) return;

      setMarcador({
        x: alvo.offsetLeft,
        y: alvo.offsetTop,
        largura: alvo.offsetWidth,
        altura: alvo.offsetHeight,
      });
    }

    medir();

    const observador = new ResizeObserver(medir);
    observador.observe(nav);
    return () => observador.disconnect();
  }, [ativo, recolhido]);

  return (
    <aside className={`flex-col ${className}`} inert={inerte}>
      <div
        className={`border-borda-suave relative flex h-14 shrink-0 items-center border-b sm:h-16 ${
          recolhido ? "justify-center px-2" : "px-4 sm:px-5"
        }`}
      >
        <Link
          href="/inicio"
          onClick={aoNavegar}
          className="flex h-11 min-w-0 items-center"
          aria-label="Início — Digital Educa"
        >
          {recolhido ? <MarcaIcone altura={26} /> : <Marca altura={24} />}
        </Link>

        {/*
          Botão de recolher, montado SOBRE a borda direita. Recolhido, a trilha
          de ícones não tem largura para o símbolo e o botão lado a lado —
          tirá-lo do fluxo resolve isso e deixa a marca centrada nos dois
          estados. O `z` vem do <aside>, senão a barra superior da área de
          conteúdo passaria por cima da metade que fica para fora.

          A chevron leva traço mais grosso que o resto dos ícones: nos 12px
          em que é desenhada, a espessura padrão quase some.
        */}
        {aoAlternarRecolhido && (
          <button
            type="button"
            onClick={aoAlternarRecolhido}
            aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
            title={recolhido ? "Expandir menu" : "Recolher menu"}
            className="border-borda-suave bg-cromo text-texto-2 hover:border-acento/60 hover:text-acento absolute top-1/2 right-0 flex h-6 w-6 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border shadow-md"
          >
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className={`ease-saida h-3 w-3 transition-transform duration-300 ${
                recolhido ? "" : "rotate-180"
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m8 5.5 4.5 4.5L8 14.5" />
            </svg>
          </button>
        )}
      </div>

      <nav
        ref={navRef}
        className="relative flex flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto p-3"
      >
        {/*
          Fundo do item ativo. É um elemento SÓ, movido de um item para o
          outro — daí ele deslizar em vez de piscar no lugar novo. Fica antes
          dos links no DOM e os links são posicionados, então eles pintam por
          cima sem precisar de z-index.

          Ao montar já nasce na posição final: transição só existe entre dois
          valores, e o primeiro é o inicial. Por isso a entrada não vem
          arrastando do canto.
        */}
        {marcador && (
          <span
            aria-hidden="true"
            style={{
              transform: `translate3d(${marcador.x}px, ${marcador.y}px, 0)`,
              width: marcador.largura,
              height: marcador.altura,
            }}
            className={`bg-acento shadow-acento/35 ease-saida absolute top-0 left-0 rounded-lg shadow-lg transition-[transform,width,height,opacity] duration-300 ${
              ativo ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {gruposPara(ehClub).map((grupo, indiceGrupo) => (
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
              const daPagina = item.href === ativo;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={(no) => {
                    if (no) itensRef.current.set(item.href, no);
                    else itensRef.current.delete(item.href);
                  }}
                  onClick={aoNavegar}
                  aria-current={daPagina ? "page" : undefined}
                  title={recolhido ? item.rotulo : undefined}
                  className={`group relative flex min-h-11 items-center rounded-lg text-sm font-medium duration-200 ${
                    recolhido ? "justify-center px-0" : "gap-3 px-3"
                  } py-2.5 ${
                    daPagina
                      ? /*
                         * Só a COR transiciona aqui, e não o fundo. O item
                         * clicado está sob o ponteiro, então carrega o fundo
                         * de hover (ou o de pressionado) — opaco e pintado por
                         * cima do marcador, já que o link é posicionado e vem
                         * depois dele no DOM. Com `transition-colors` esse
                         * retângulo claro desbotava por 200ms bem em cima do
                         * marcador que chegava: era a piscada. Fora da lista,
                         * `background-color` volta ao transparente de uma vez
                         * e descobre o marcador na hora.
                         *
                         * O atraso na cor espera o marcador chegar: sem ele o
                         * rótulo ficaria branco sobre o fundo do menu no meio
                         * do caminho.
                         */
                        "text-white transition-[color] delay-100"
                      : "text-texto-2 hover:bg-superficie-2 hover:text-texto active:bg-borda-suave transition-colors"
                  }`}
                >
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
            {avatar ? (
              <span className="bg-superficie-2 relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
                <Image src={avatar} alt="" fill sizes="36px" className="object-cover" />
              </span>
            ) : (
              <span className="bg-acento/15 text-acento flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                {(nome ?? email ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
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

/** Sol de dia, lua à noite. Decorativo: a saudação ao lado já diz o período. */
function IconeSaudacao({ periodo }: { periodo: "dia" | "noite" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="text-acento h-[18px] w-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {periodo === "noite" ? (
        <path d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9Z" />
      ) : (
        <>
          <circle cx="10" cy="10" r="3.6" />
          <path d="M10 1.8v1.8M10 16.4v1.8M18.2 10h-1.8M3.6 10H1.8M15.8 4.2l-1.3 1.3M5.5 14.5l-1.3 1.3M15.8 15.8l-1.3-1.3M5.5 5.5 4.2 4.2" />
        </>
      )}
    </svg>
  );
}

function IconeMenu() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 5.5h14M3 10h14M3 14.5h14" strokeLinecap="round" />
    </svg>
  );
}
