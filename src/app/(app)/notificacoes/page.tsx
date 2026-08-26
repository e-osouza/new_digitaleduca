import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listarNotificacoes } from "@/lib/queries";
import { FAIXA } from "@/lib/ui";
import { EstadoVazio } from "@/components/estado-vazio";
import { IlustracaoSemConteudo } from "@/components/ilustracoes";
import { ListaNotificacoes } from "@/components/lista-notificacoes";
import { Paginacao } from "@/components/paginacao";

export const metadata: Metadata = { title: "Notificações" };

/** 20 por página: o painel do sino mostra 15, aqui cabe a lista inteira do dia. */
const POR_PAGINA = 20;

/**
 * A caixa de entrada completa.
 *
 * O sino mostra os últimos avisos e serve para o de agora; esta página é para
 * procurar o de ontem. Por isso ela pagina, e por isso o "Ver todas" do painel
 * aponta para cá em vez de o painel crescer sem fim.
 */
export default async function Notificacoes({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { pagina } = await searchParams;
  const paginaAtual = Math.max(1, Number(pagina) || 1);

  const caixa = await listarNotificacoes(paginaAtual, POR_PAGINA);

  const itens = caixa?.data ?? [];
  const total = caixa?.pagination?.total ?? itens.length;
  const totalPaginas = Math.max(
    1,
    caixa?.pagination?.totalPages ?? Math.ceil(total / POR_PAGINA),
  );

  /*
   * Página além do fim — acontece ao voltar num endereço guardado depois de
   * ler tudo. Devolve para a última que existe, em vez de mostrar uma lista
   * vazia que parece "você não tem avisos".
   */
  if (total > 0 && paginaAtual > totalPaginas) {
    redirect(
      totalPaginas > 1
        ? `/notificacoes?pagina=${totalPaginas}`
        : "/notificacoes",
    );
  }

  if (itens.length === 0) {
    return (
      <div className={`${FAIXA} flex flex-1 flex-col py-8 sm:py-10`}>
        <EstadoVazio
          ilustracao={<IlustracaoSemConteudo />}
          titulo="Notificações"
          descricao={
            caixa
              ? "Nada por aqui. Quando entrar conteúdo novo ou a equipe enviar um aviso, ele aparece nesta página."
              : "Não foi possível carregar seus avisos agora. Recarregue a página em instantes."
          }
        >
          <Link
            href="/inicio"
            className="bg-acento text-white hover:bg-acento-hover flex min-h-11 items-center rounded-full px-6 text-sm font-bold transition-colors"
          >
            Explorar o catálogo
          </Link>
        </EstadoVazio>
      </div>
    );
  }

  return (
    <div
      className={`${FAIXA} mx-auto flex max-w-3xl flex-col gap-6 py-8 sm:gap-8 sm:py-10`}
    >
      <header className="flex flex-col gap-1.5 sm:gap-2">
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Notificações
        </h1>
        <p className="text-texto-3 text-sm">
          Avisos de conteúdo novo e recados da equipe.
          <span className="tabular-nums"> · {total} no total</span>
        </p>
      </header>

      {/*
        A chave zera o que foi marcado como lido na página anterior: sem ela, o
        "marcar todas" da página 1 continuaria valendo — e visualmente lido —
        para os avisos da página 2, que ninguém tocou.
      */}
      <ListaNotificacoes key={paginaAtual} itens={itens} />

      <Paginacao
        base="/notificacoes"
        pagina={Math.min(paginaAtual, totalPaginas)}
        totalPaginas={totalPaginas}
      />
    </div>
  );
}
