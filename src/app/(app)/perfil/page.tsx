import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  emAndamento,
  listarSelecionados,
  listarTrilhas,
  normalizarMe,
  obterInteresse,
  obterMe,
  obterNegocio,
  paraCard,
} from "@/lib/queries";
import { formatarDuracao } from "@/lib/format";
import { FAIXA } from "@/lib/ui";
import { CardConteudo } from "@/components/card-conteudo";
import { Selo } from "@/components/selo";
import type { Trilha } from "@/types/api";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function Perfil() {
  const [me, interesse, negocio, trilhas, continuar, salvos] = await Promise.all([
    obterMe(),
    obterInteresse(),
    obterNegocio(),
    listarTrilhas(),
    emAndamento(8),
    listarSelecionados(),
  ]);

  const { usuario, assinatura, temAssinaturaAtiva } = normalizarMe(me);

  if (!usuario) {
    return (
      <div className={`${FAIXA} mx-auto max-w-3xl py-16 text-center`}>
        <p className="text-texto font-semibold">Não foi possível carregar seu perfil.</p>
        <p className="text-texto-3 mt-1 text-sm">Recarregue a página em instantes.</p>
      </div>
    );
  }

  const numeros = agregar(trilhas);

  return (
    <div className={`${FAIXA} mx-auto flex max-w-5xl flex-col gap-8 py-8 sm:gap-10 sm:py-10`}>
      <Cabecalho
        nome={usuario.nome}
        email={usuario.email}
        cargo={usuario.cargo ?? null}
        areaAtuacao={usuario.areaAtuacao ?? null}
        tempoExperiencia={usuario.tempoExperiencia ?? null}
        plano={temAssinaturaAtiva ? (assinatura?.plano ?? "Assinatura ativa") : null}
      />

      {/*
        Cada número diz exatamente o que mede.
        A API não expõe totais do usuário — `/progresso-video/em-andamento`
        devolve só o que está abaixo de 100%, então um "tempo total assistido"
        encolheria conforme a pessoa concluísse os cursos. Os agregados das
        trilhas (`tempoAssistidoSegundos`, `aulasConcluidas`, `sequenciaDias`)
        são os únicos que o backend fecha de verdade, e é o que rotulamos.
      */}
      <section className="flex flex-col gap-3">
        <TituloSecao>Sua jornada</TituloSecao>
        <div className="xs:grid-cols-2 grid grid-cols-1 gap-3 lg:grid-cols-4">
          <Estatistica
            valor={formatarDuracao(numeros.tempoTrilhas) || "0 min"}
            rotulo="Assistido em trilhas"
            detalhe="Tempo somado das suas trilhas"
          />
          <Estatistica
            valor={String(numeros.aulasConcluidas)}
            rotulo="Aulas concluídas"
            detalhe={`de ${numeros.totalAulas} nas suas trilhas`}
          />
          <Estatistica
            valor={String(numeros.trilhasConcluidas)}
            rotulo="Trilhas concluídas"
            detalhe={`de ${trilhas.length} ${trilhas.length === 1 ? "criada" : "criadas"}`}
          />
          <Estatistica
            valor={String(numeros.sequencia)}
            rotulo={numeros.sequencia === 1 ? "Dia seguido" : "Dias seguidos"}
            detalhe="Sua melhor sequência"
          />
        </div>

        <div className="xs:grid-cols-2 grid grid-cols-1 gap-3">
          <Estatistica
            valor={String(continuar.length)}
            rotulo="Conteúdos em andamento"
            detalhe="Começados e ainda não terminados"
          />
          <Estatistica
            valor={String(salvos.length)}
            rotulo="Salvos na Minha lista"
            detalhe="Guardados para assistir depois"
          />
        </div>
      </section>

      {continuar.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-4">
            <TituloSecao>Continue de onde parou</TituloSecao>
            <Link
              href="/meus-conteudos"
              className="text-texto-3 hover:text-acento shrink-0 text-sm transition-colors"
            >
              Ver tudo
            </Link>
          </div>
          <div className="xs:grid-cols-2 grid grid-cols-1 gap-x-4 gap-y-6 lg:grid-cols-4">
            {continuar.slice(0, 4).map((item) => (
              <CardConteudo
                key={item.conteudoId}
                conteudo={paraCard(item)}
                largura="w-full"
                orientacao="horizontal"
                progresso={item.percentualAssistido}
                duracaoSegundos={item.duracao}
                href={`/conteudo/${item.conteudoId}?assistir=1`}
              />
            ))}
          </div>
        </section>
      )}

      {trilhas.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-4">
            <TituloSecao>Suas trilhas</TituloSecao>
            <Link
              href="/trilhas"
              className="text-texto-3 hover:text-acento shrink-0 text-sm transition-colors"
            >
              Ver todas
            </Link>
          </div>
          <ul className="border-borda-suave divide-borda-suave bg-superficie divide-y overflow-hidden rounded-xl border">
            {trilhas.slice(0, 4).map((trilha) => (
              <li key={trilha.id}>
                {/*
                  O realce da linha desce para a cor da página, e não para
                  `superficie-2`: esse é o tom da pista da barra de progresso
                  logo abaixo, que sumiria sob o cursor.
                */}
                <Link
                  href={`/trilhas/${trilha.id}`}
                  className="hover:bg-fundo flex items-center gap-4 px-4 py-3.5 transition-colors"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <p className="text-texto truncate text-sm font-semibold">
                      {trilha.titulo}
                    </p>
                    <div className="bg-superficie-2 h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-acento h-full rounded-full"
                        style={{
                          width: `${Math.min(Math.max(trilha.progressoPercent, 0), 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-texto-3 shrink-0 text-xs tabular-nums">
                    {trilha.aulasConcluidas}/{trilha.totalAulas}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <TituloSecao>Sobre você</TituloSecao>
          <Link
            href="/conta"
            className="text-texto-3 hover:text-acento shrink-0 text-sm transition-colors"
          >
            Editar
          </Link>
        </div>

        <dl className="border-borda-suave bg-superficie grid grid-cols-1 gap-x-8 gap-y-4 rounded-xl border p-5 sm:grid-cols-2">
          <Campo termo="E-mail" valor={usuario.email} />
          <Campo termo="Celular" valor={usuario.celular} />
          <Campo termo="Cargo" valor={usuario.cargo ?? null} />
          <Campo termo="Função" valor={usuario.funcao ?? null} />
          <Campo termo="Área de atuação" valor={usuario.areaAtuacao ?? null} />
          <Campo termo="Tempo de experiência" valor={usuario.tempoExperiencia ?? null} />
          <Campo
            termo="Objetivo na plataforma"
            valor={usuario.objetivoPlataforma ?? null}
            largo
          />
          <Campo
            termo="Formato preferido"
            valor={usuario.formatoAprendizado ?? null}
          />
          <Campo termo="Temas de interesse" valor={interesse?.temasAprender ?? null} />
          <Campo
            termo="Nível de conhecimento"
            valor={interesse?.nivelConhecimento ?? null}
          />
          <Campo
            termo="Tempo disponível por semana"
            valor={interesse?.tempoDisponivelSemana ?? null}
          />
          <Campo termo="Empresa" valor={negocio?.nomeEmpresa ?? null} />
          <Campo termo="Setor" valor={negocio?.setorAtuacao ?? null} />
        </dl>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Cabecalho({
  nome,
  email,
  cargo,
  areaAtuacao,
  tempoExperiencia,
  plano,
}: {
  nome: string;
  email: string;
  cargo: string | null;
  areaAtuacao: string | null;
  tempoExperiencia: string | null;
  plano: string | null;
}) {
  // Sem campo de avatar na API: a inicial do nome faz o papel.
  const inicial = nome.trim().charAt(0).toUpperCase() || "?";
  const linha = [cargo, areaAtuacao].filter(Boolean).join(" · ");

  return (
    <header className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
      <span
        aria-hidden="true"
        className="bg-acento text-white font-display flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-3xl font-semibold"
      >
        {inicial}
      </span>

      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="font-display text-xl font-semibold tracking-tight text-balance sm:text-2xl lg:text-3xl">
          {nome}
        </h1>
        <p className="text-texto-3 truncate text-sm">{linha || email}</p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          {plano ? (
            <Selo variacao="acento">{plano}</Selo>
          ) : (
            <Selo>Sem assinatura ativa</Selo>
          )}
          {tempoExperiencia && <Selo>{tempoExperiencia} de experiência</Selo>}
        </div>
      </div>

      <Link
        href="/conta"
        className="border-borda bg-superficie hover:border-acento/60 hover:bg-superficie-2 mt-1 shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors sm:ml-auto"
      >
        Editar perfil
      </Link>
    </header>
  );
}

function TituloSecao({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-texto-2 text-xs font-semibold tracking-wider uppercase">
      {children}
    </h2>
  );
}

function Estatistica({
  valor,
  rotulo,
  detalhe,
}: {
  valor: string;
  rotulo: string;
  detalhe: string;
}) {
  return (
    <div className="border-borda-suave bg-superficie flex flex-col gap-0.5 rounded-xl border p-4">
      <span className="font-display text-acento text-2xl font-semibold tabular-nums">
        {valor}
      </span>
      <span className="text-texto text-sm font-semibold">{rotulo}</span>
      <span className="text-texto-3 text-xs leading-snug">{detalhe}</span>
    </div>
  );
}

function Campo({
  termo,
  valor,
  largo = false,
}: {
  termo: string;
  valor: string | null;
  largo?: boolean;
}) {
  return (
    <div className={largo ? "sm:col-span-2" : undefined}>
      <dt className="text-texto-3 text-xs font-semibold tracking-wider uppercase">
        {termo}
      </dt>
      <dd className={`mt-0.5 text-sm ${valor ? "text-texto" : "text-texto-3 italic"}`}>
        {valor || "Não informado"}
      </dd>
    </div>
  );
}

/**
 * Agregados da jornada. Só as trilhas fecham números confiáveis: o backend
 * mantém `tempoAssistidoSegundos`, `aulasConcluidas` e `sequenciaDias` por
 * trilha, e nenhum outro endpoint do usuário devolve totais.
 */
function agregar(trilhas: Trilha[]) {
  return {
    tempoTrilhas: soma(trilhas, (t) => t.tempoAssistidoSegundos),
    aulasConcluidas: soma(trilhas, (t) => t.aulasConcluidas),
    totalAulas: soma(trilhas, (t) => t.totalAulas),
    trilhasConcluidas: trilhas.filter((t) => t.status === "CONCLUIDA").length,
    // Sequência é por trilha; a melhor delas representa o hábito da pessoa.
    sequencia: trilhas.reduce((maior, t) => Math.max(maior, t.sequenciaDias ?? 0), 0),
  };
}

function soma(trilhas: Trilha[], escolher: (t: Trilha) => number | undefined) {
  return trilhas.reduce((total, trilha) => total + (escolher(trilha) ?? 0), 0);
}
