import type { Metadata } from "next";
import { listarPlanos, normalizarMe, obterMe } from "@/lib/queries";
import { formatarPreco } from "@/lib/format";
import { FAIXA } from "@/lib/ui";
import { Selo } from "@/components/selo";

export const metadata: Metadata = { title: "Planos" };

const BENEFICIOS = [
  "Acervo completo de cursos e super aulas",
  "Replays do DSX",
  "Entrevistas exclusivas",
  "Acesso pelo navegador e pelos apps",
];

const INTERVALOS: Record<string, string> = {
  day: "por dia",
  week: "por semana",
  month: "por mês",
  year: "por ano",
};

export default async function PaginaPlanos() {
  const [planos, me] = await Promise.all([listarPlanos(), obterMe()]);
  const { temAssinaturaAtiva, ehCortesia } = normalizarMe(me);

  const pagos = planos
    .filter((plano) => plano.preco > 0)
    .sort((a, b) => a.preco - b.preco);

  return (
    <div className={`${FAIXA} mx-auto flex max-w-4xl flex-col gap-8 py-8 sm:py-10`}>
      <header className="flex flex-col gap-1.5 sm:gap-2">
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Planos
        </h1>
        <p className="text-texto-3 text-sm">
          {ehCortesia
            ? "Você tem acesso de cortesia — todo o acervo já está liberado."
            : temAssinaturaAtiva
              ? "Sua assinatura está ativa — você já tem acesso a tudo."
              : "Libere o acervo completo e os conteúdos novos de cada quinzena."}
        </p>
      </header>

      {pagos.length === 0 ? (
        <p className="border-borda-suave text-texto-3 rounded-xl border border-dashed p-5 text-sm">
          Nenhum plano disponível no momento.
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {pagos.map((plano, indice) => {
            const destaque = indice === pagos.length - 1 && pagos.length > 1;

            return (
              <li
                key={plano.id}
                className={`flex flex-col gap-5 rounded-2xl border p-6 ${
                  destaque
                    ? "border-acento/50 bg-superficie"
                    : "border-borda-suave bg-superficie/60"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-acento text-xs font-semibold tracking-wider uppercase">
                      Plano {plano.nome}
                    </span>
                    {destaque && <Selo variacao="acento">Melhor valor</Selo>}
                  </div>

                  <span className="font-display text-3xl font-semibold tracking-tight">
                    {formatarPreco(plano.preco)}
                  </span>
                  <span className="text-texto-3 text-sm">
                    {INTERVALOS[plano.intervalo] ?? ""}
                    {plano.permiteParcelamento && plano.maxParcelas > 1
                      ? ` · em até ${plano.maxParcelas}x`
                      : ""}
                  </span>
                </div>

                {plano.descricao && (
                  <p className="text-texto-2 text-sm leading-relaxed whitespace-pre-line">
                    {plano.descricao}
                  </p>
                )}

                <ul className="flex flex-col gap-2">
                  {BENEFICIOS.map((item) => (
                    <li
                      key={item}
                      className="text-texto-2 flex items-start gap-2.5 text-sm"
                    >
                      <span aria-hidden="true" className="text-acento shrink-0">
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <a
                  href="https://digitaleduca.com.vc/#planos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-auto flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-bold transition-colors ${
                    destaque
                      ? "bg-acento text-fundo hover:bg-acento-hover"
                      : "border-borda text-texto hover:border-acento/60 hover:bg-superficie border"
                  }`}
                >
                  Assinar
                </a>
              </li>
            );
          })}
        </ul>
      )}

      {/*
        O checkout ainda não vive aqui: a API tem campos de Stripe nos planos,
        mas `POST /assinatura` espera cardToken do Mercado Pago. Enquanto o
        gateway não for definido, a contratação segue pelo site institucional.
      */}
      <p className="text-texto-3 text-sm">
        A contratação é concluída no site oficial. Assim que a assinatura for
        confirmada, o acesso libera automaticamente aqui.
      </p>
    </div>
  );
}
