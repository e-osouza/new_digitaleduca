import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  emAndamento,
  listarSalvos,
  listarListas,
  normalizarMe,
  obterEstatisticas,
  obterInteresse,
  obterMe,
  obterNegocio,
  paraCard,
} from "@/lib/queries";
import { formatarDuracao } from "@/lib/format";
import { FAIXA } from "@/lib/ui";
import { CardConteudo } from "@/components/card-conteudo";
import { Selo } from "@/components/selo";
import { AvatarUpload } from "@/components/avatar-upload";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function Perfil() {
  const [me, interesse, negocio, listas, continuar, salvos, estatisticas] =
    await Promise.all([
      obterMe(),
      obterInteresse(),
      obterNegocio(),
      listarListas(),
      emAndamento(8),
      listarSalvos(),
      obterEstatisticas(),
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

  const stats = estatisticas ?? {
    segundosAssistidos: 0,
    videosConcluidos: 0,
    cursosFinalizados: 0,
    conteudosEmAndamento: 0,
    ultimaAtividade: null,
  };

  return (
    <div className={`${FAIXA} mx-auto flex max-w-5xl flex-col gap-8 py-8 sm:gap-10 sm:py-10`}>
      <Cabecalho
        nome={usuario.nome}
        email={usuario.email}
        avatar={usuario.avatar ?? null}
        cargo={usuario.cargo ?? null}
        areaAtuacao={usuario.areaAtuacao ?? null}
        tempoExperiencia={usuario.tempoExperiencia ?? null}
        plano={temAssinaturaAtiva ? (assinatura?.plano ?? "Assinatura ativa") : null}
      />

      {/*
        Totais reais da plataforma, de `GET /progresso-video/estatisticas`:
        tempo assistido (posição de retomada, com o vídeo concluído contando
        pela duração cheia), vídeos e cursos concluídos e o que segue em
        andamento. Um curso é "finalizado" quando todos os seus vídeos foram
        concluídos.
      */}
      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <TituloSecao>Sua jornada</TituloSecao>
          <Link
            href="/estatisticas"
            className="text-texto-3 hover:text-acento shrink-0 text-sm transition-colors"
          >
            Ver estatísticas
          </Link>
        </div>
        <div className="xs:grid-cols-2 grid grid-cols-1 gap-3 lg:grid-cols-4">
          <Estatistica
            valor={formatarDuracao(stats.segundosAssistidos) || "0 min"}
            rotulo="Tempo assistido"
            detalhe="No total da plataforma"
          />
          <Estatistica
            valor={String(stats.videosConcluidos)}
            rotulo="Aulas concluídas"
            detalhe="Vídeos que você terminou"
          />
          <Estatistica
            valor={String(stats.cursosFinalizados)}
            rotulo="Cursos finalizados"
            detalhe="Conteúdos concluídos por inteiro"
          />
          <Estatistica
            valor={String(stats.conteudosEmAndamento)}
            rotulo="Em andamento"
            detalhe="Começados e ainda não terminados"
          />
        </div>

        <div className="xs:grid-cols-2 grid grid-cols-1 gap-3">
          <Estatistica
            valor={String(listas.length)}
            rotulo={listas.length === 1 ? "Lista criada" : "Listas criadas"}
            detalhe="Suas coleções de aulas"
          />
          <Estatistica
            valor={String(salvos.length)}
            rotulo="Salvos"
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

      {listas.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-4">
            <TituloSecao>Suas listas</TituloSecao>
            <Link
              href="/listas"
              className="text-texto-3 hover:text-acento shrink-0 text-sm transition-colors"
            >
              Ver todas
            </Link>
          </div>
          <ul className="border-borda-suave divide-borda-suave bg-superficie divide-y overflow-hidden rounded-xl border">
            {listas.slice(0, 4).map((lista) => (
              <li key={lista.id}>
                {/*
                  O realce da linha desce para a cor da página, e não para
                  `superficie-2`: esse é o tom da pista da barra de progresso
                  logo abaixo, que sumiria sob o cursor.
                */}
                <Link
                  href={`/listas/${lista.id}`}
                  className="hover:bg-fundo flex items-center gap-4 px-4 py-3.5 transition-colors"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <p className="text-texto truncate text-sm font-semibold">
                      {lista.titulo}
                    </p>
                    <div className="bg-superficie-2 h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-acento h-full rounded-full"
                        style={{
                          width: `${Math.min(Math.max(lista.progressoPercent, 0), 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-texto-3 shrink-0 text-xs tabular-nums">
                    {lista.aulasConcluidas}/{lista.totalAulas}
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
  avatar,
  cargo,
  areaAtuacao,
  tempoExperiencia,
  plano,
}: {
  nome: string;
  email: string;
  avatar: string | null;
  cargo: string | null;
  areaAtuacao: string | null;
  tempoExperiencia: string | null;
  plano: string | null;
}) {
  const linha = [cargo, areaAtuacao].filter(Boolean).join(" · ");

  return (
    <header className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
      <AvatarUpload avatar={avatar} nome={nome} />

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

