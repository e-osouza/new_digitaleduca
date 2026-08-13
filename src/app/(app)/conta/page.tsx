import type { Metadata } from "next";
import {
  normalizarMe,
  obterInteresse,
  obterMe,
  obterNegocio,
} from "@/lib/queries";
import { formatarData } from "@/lib/format";
import { FAIXA } from "@/lib/ui";
import { lerTema } from "@/lib/tema";
import { Abas } from "@/components/abas";
import { FormularioConta } from "@/components/formulario-conta";
import { FormularioPerfil } from "@/components/formulario-perfil";
import { FormularioSeguranca } from "@/components/formulario-seguranca";
import { SeletorTema } from "@/components/seletor-tema";
import { Selo } from "@/components/selo";
import { ExcluirConta } from "@/components/excluir-conta";

export const metadata: Metadata = { title: "Configurações" };

const ABAS = [
  { chave: "perfil", rotulo: "Perfil" },
  { chave: "empresa", rotulo: "Empresa" },
  { chave: "conta", rotulo: "Conta" },
] as const;

type ChaveAba = (typeof ABAS)[number]["chave"];

const DESCRICOES: Record<ChaveAba, string> = {
  perfil: "Seus dados e o que você quer aprender.",
  empresa: "O contexto do seu negócio, usado nas recomendações.",
  conta: "Assinatura, aparência, senha e avisos.",
};

export default async function PaginaConta({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const { aba } = await searchParams;
  const ativa: ChaveAba =
    ABAS.find((item) => item.chave === aba)?.chave ?? "perfil";

  return (
    <div className={`${FAIXA} mx-auto flex max-w-3xl flex-col gap-8 py-8 sm:py-10`}>
      <header className="flex flex-col gap-1.5 sm:gap-2">
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Configurações
        </h1>
        <p className="text-texto-3 text-sm">{DESCRICOES[ativa]}</p>
      </header>

      <Abas base="/conta" atual={ativa} itens={ABAS} />

      {/*
        Cada aba é um componente de servidor que busca só os seus dados: trocar
        de aba não paga pelas chamadas das outras duas.
      */}
      {ativa === "perfil" && <AbaPerfil />}
      {ativa === "empresa" && <AbaEmpresa />}
      {ativa === "conta" && <AbaConta />}
    </div>
  );
}

/* ------------------------------ perfil ------------------------------ */

async function AbaPerfil() {
  const [me, interesse] = await Promise.all([obterMe(), obterInteresse()]);
  const { usuario } = normalizarMe(me);

  if (!usuario) return <FalhaAoCarregar />;

  return (
    <div className="flex flex-col gap-8">
      <FormularioConta usuario={usuario} />

      <section className="border-borda-suave flex flex-col gap-4 border-t pt-8">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-base font-semibold">
            Seus objetivos de estudo
          </h2>
          <p className="text-texto-3 text-sm">
            Quanto mais específico, melhores as recomendações.
          </p>
        </div>
        <FormularioPerfil
          rota="/api/perfil/interesse"
          valores={(interesse ?? {}) as Record<string, string | null>}
          campos={[
            {
              id: "temasAprender",
              rotulo: "O que quer aprender",
              exemplo: "Gestão financeira e precificação",
              multilinha: true,
            },
            {
              id: "dificuldadeAtual",
              rotulo: "Maior dificuldade hoje",
              exemplo: "Fluxo de caixa",
            },
            {
              id: "nivelConhecimento",
              rotulo: "Nível de conhecimento",
              exemplo: "Intermediário",
            },
            {
              id: "tempoDisponivelSemana",
              rotulo: "Tempo por semana",
              exemplo: "2 a 4 horas",
            },
            {
              id: "estiloAprendizado",
              rotulo: "Formato preferido",
              exemplo: "Aulas curtas",
            },
          ]}
        />
      </section>
    </div>
  );
}

/* ------------------------------ empresa ------------------------------ */

async function AbaEmpresa() {
  const negocio = await obterNegocio();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-base font-semibold">Sua empresa</h2>
        <p className="text-texto-3 text-sm">
          Ajuda a plataforma a sugerir conteúdo para o seu momento.
        </p>
      </div>
      <FormularioPerfil
        rota="/api/perfil/negocio"
        valores={(negocio ?? {}) as Record<string, string | null>}
        campos={[
          { id: "nomeEmpresa", rotulo: "Nome da empresa", exemplo: "Acme Ltda" },
          { id: "setorAtuacao", rotulo: "Setor de atuação", exemplo: "Varejo" },
          {
            id: "numeroColaboradores",
            rotulo: "Nº de colaboradores",
            exemplo: "11 a 50",
          },
          {
            id: "faixaFaturamentoAnual",
            rotulo: "Faturamento anual",
            exemplo: "Até R$ 1 milhão",
          },
          { id: "faseAtual", rotulo: "Fase atual", exemplo: "Crescimento" },
          {
            id: "desafiosNegocio",
            rotulo: "Principais desafios",
            exemplo: "Escalar vendas mantendo a margem",
            multilinha: true,
          },
        ]}
      />
    </section>
  );
}

/* ------------------------------- conta ------------------------------- */

async function AbaConta() {
  const [me, tema] = await Promise.all([obterMe(), lerTema()]);
  const { usuario, assinatura, temAssinaturaAtiva, ehCortesia } =
    normalizarMe(me);

  return (
    <div className="flex flex-col gap-8">
      <section className="border-borda-suave bg-superficie flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5">
        <div className="flex flex-col gap-1">
          <span className="text-texto-3 text-xs font-semibold tracking-wider uppercase">
            {ehCortesia ? "Cortesia" : "Assinatura"}
          </span>
          <span className="text-sm font-semibold">
            {ehCortesia
              ? "Acesso de cortesia liberado"
              : temAssinaturaAtiva
                ? `Acesso completo${assinatura?.plano ? ` · plano ${assinatura.plano}` : ""}`
                : "Sem assinatura ativa"}
          </span>
          {temAssinaturaAtiva && assinatura?.dataFim && (
            <span className="text-texto-3 text-xs">
              Válido até {formatarData(assinatura.dataFim)}
            </span>
          )}
        </div>
        <Selo variacao={temAssinaturaAtiva ? "gratis" : "neutro"}>
          {ehCortesia ? "Cortesia" : temAssinaturaAtiva ? "Ativa" : "Inativa"}
        </Selo>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-base font-semibold">Aparência</h2>
          <p className="text-texto-3 text-sm">
            Vale para este navegador e fica salvo entre as visitas.
          </p>
        </div>
        <SeletorTema atual={tema} />
      </section>

      <div className="border-borda-suave border-t pt-8">
        {usuario ? (
          <FormularioSeguranca
            aceitaNotificacoes={usuario.aceitaNotificacoes ?? false}
          />
        ) : (
          <FalhaAoCarregar />
        )}
      </div>

      <ExcluirConta />
    </div>
  );
}

function FalhaAoCarregar() {
  return (
    <p className="border-borda-suave text-texto-3 rounded-xl border border-dashed p-5 text-sm leading-relaxed">
      Não conseguimos carregar seus dados agora. Recarregue a página ou tente de
      novo em instantes.
    </p>
  );
}
