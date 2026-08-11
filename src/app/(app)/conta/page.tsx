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
import { FormularioConta } from "@/components/formulario-conta";
import { SeletorTema } from "@/components/seletor-tema";
import { FormularioPerfil } from "@/components/formulario-perfil";
import { Selo } from "@/components/selo";

export const metadata: Metadata = { title: "Configurações" };

export default async function PaginaConta() {
  const [me, tema, negocio, interesse] = await Promise.all([
    obterMe(),
    lerTema(),
    obterNegocio(),
    obterInteresse(),
  ]);
  const { usuario, assinatura, temAssinaturaAtiva, ehCortesia } =
    normalizarMe(me);

  return (
    <div className={`${FAIXA} mx-auto flex max-w-3xl flex-col gap-8 py-8 sm:py-10`}>
      <header className="flex flex-col gap-1.5 sm:gap-2">
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Configurações
        </h1>
        <p className="text-texto-3 text-sm">
          Seus dados, preferências e status da assinatura.
        </p>
      </header>

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

      {usuario ? (
        <FormularioConta usuario={usuario} />
      ) : (
        <p className="border-borda-suave text-texto-3 rounded-xl border border-dashed p-5 text-sm leading-relaxed">
          Não conseguimos carregar seus dados agora. Recarregue a página ou tente
          de novo em instantes.
        </p>
      )}

      <section className="border-borda-suave flex flex-col gap-4 border-t pt-8">
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
