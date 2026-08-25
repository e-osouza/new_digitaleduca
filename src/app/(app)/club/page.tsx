import type { Metadata } from "next";
import Link from "next/link";
import { obterEstatisticasDoTime, obterMeuTime } from "@/lib/queries";
import { FAIXA } from "@/lib/ui";
import { Abas } from "@/components/abas";
import { FiltroPeriodo } from "@/components/filtro-periodo";
import { CabecalhoClub } from "@/components/club/cabecalho";
import { PainelClub } from "@/components/club/painel";
import { EstatisticasDoClub } from "@/components/club/estatisticas";

export const metadata: Metadata = { title: "Digital Club" };

const ABAS = [
  { chave: "inicio", rotulo: "Início" },
  { chave: "estatisticas", rotulo: "Estatísticas" },
] as const;

type ChaveAba = (typeof ABAS)[number]["chave"];

/** Últimos 30 dias — o padrão, igual ao das estatísticas do aluno. */
function periodoPadrao() {
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hoje = new Date();
  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - 29);
  return { de: fmt(inicio), ate: fmt(hoje) };
}

/**
 * Painel do dono do Digital Club.
 *
 * Abre inclusive com a participação vencida: `ativo: false` mantém o time
 * visível e trava só o convite. Quem venceu é justamente quem precisa entrar
 * aqui para entender por que o time parou — um 403 no lugar disso seria a
 * porta batendo na cara de quem veio resolver.
 */
export default async function PaginaClub({
  searchParams,
}: {
  searchParams: Promise<{
    aba?: string;
    de?: string;
    ate?: string;
    todo?: string;
  }>;
}) {
  const sp = await searchParams;
  const ativa: ChaveAba =
    ABAS.find((item) => item.chave === sp.aba)?.chave ?? "inicio";

  const time = await obterMeuTime();

  if (!time) {
    return (
      <div className={`${FAIXA} mx-auto flex max-w-2xl flex-col gap-5 py-10`}>
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
          Digital Club
        </h1>
        <p className="text-texto-2 text-sm">
          O Digital Club é para quem leva a equipe junto: você convida pessoas
          do seu time e todas passam a ver o conteúdo da plataforma pela sua
          participação. Sua conta não faz parte do Club hoje.
        </p>
        <Link
          href="/planos"
          className="bg-acento hover:bg-acento-hover flex min-h-12 w-fit items-center rounded-full px-7 text-sm font-bold text-white transition-colors"
        >
          Ver planos
        </Link>
      </div>
    );
  }

  const semLimite = sp.todo === "1";
  const padrao = periodoPadrao();
  const de = semLimite ? undefined : (sp.de ?? padrao.de);
  const ate = semLimite ? undefined : (sp.ate ?? padrao.ate);

  /*
    As estatísticas só são buscadas na aba delas: são uma varredura de todo o
    progresso do time, e pagá-la para quem veio administrar o time seria custo
    puro. É a mesma razão de as abas serem navegação por URL, e não estado.
  */
  const estatisticas =
    ativa === "estatisticas" ? await obterEstatisticasDoTime(de, ate) : null;

  return (
    <div
      className={`${FAIXA} mx-auto flex max-w-5xl flex-col gap-6 py-8 sm:gap-8 sm:py-10`}
    >
      {/*
        O cabeçalho é o mesmo nas duas abas, e de propósito: o estado da
        participação governa tudo que vem depois. Nas estatísticas ele explica
        por que os números podem ter parado; no time, por que os convites estão
        pausados.
      */}
      <CabecalhoClub time={time} />

      <Abas base="/club" atual={ativa} itens={ABAS} />

      {ativa === "inicio" && <PainelClub time={time} />}

      {ativa === "estatisticas" && (
        <div className="flex flex-col gap-6">
          <FiltroPeriodo
            de={de}
            ate={ate}
            todo={semLimite}
            base="/club"
            extras={{ aba: "estatisticas" }}
          />

          {estatisticas ? (
            <EstatisticasDoClub dados={estatisticas} />
          ) : (
            <p className="border-borda bg-superficie text-texto-2 rounded-2xl border border-dashed p-6 text-center text-sm">
              Não foi possível carregar as estatísticas agora.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
