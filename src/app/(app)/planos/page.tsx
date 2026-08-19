import type { Metadata } from "next";
import Link from "next/link";
import { listarPlanos, normalizarMe, obterMe } from "@/lib/queries";
import { formatarPreco } from "@/lib/format";
import { FAIXA } from "@/lib/ui";
import { Selo } from "@/components/selo";
import { CheckoutAssinatura } from "@/components/checkout-assinatura";

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

export default async function PaginaPlanos({
  searchParams,
}: {
  searchParams: Promise<{ conteudo?: string; voltar?: string }>;
}) {
  const [planos, me, { conteudo, voltar }] = await Promise.all([
    listarPlanos(),
    obterMe(),
    searchParams,
  ]);
  const { temAssinaturaAtiva, ehCortesia } = normalizarMe(me);

  /*
   * `?conteudo=` marca quem foi trazido de um "Assistir" que a API recusou.
   * Sem essa pista a pessoa cairia numa tabela de preços sem entender por que
   * saiu do vídeo — e sem caminho de volta para o que queria ver.
   */
  const bloqueadoId = Number(conteudo);
  const veioDeBloqueio = Number.isInteger(bloqueadoId) && bloqueadoId > 0;

  /*
   * `?voltar=` diz PARA ONDE devolver, e não só qual conteúdo era. A ficha
   * deixou de ser o destino único: podcast volta para a própria tela do
   * podcast, e uma aula aberta por dentro de uma lista volta para a lista.
   *
   * Só caminho interno é aceito. Sem essa checagem o parâmetro viraria um
   * redirecionamento aberto — bastaria alguém compartilhar
   * `/planos?voltar=https://…` para o link de volta apontar para fora.
   * `//` também é barrado: `//exemplo.com` é endereço absoluto de protocolo
   * relativo, e passaria por um teste ingênuo de "começa com barra".
   */
  const destinoVolta =
    voltar && voltar.startsWith("/") && !voltar.startsWith("//")
      ? voltar
      : `/conteudo/${bloqueadoId}`;

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

      {veioDeBloqueio && !temAssinaturaAtiva && !ehCortesia && (
        <div className="border-acento/40 bg-acento/10 flex flex-col items-start gap-3 rounded-xl border p-5">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="bg-acento-claro/15 text-acento-claro mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            >
              <svg
                viewBox="0 0 20 20"
                className="h-4.5 w-4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="8.5" width="12" height="8" rx="2" />
                <path d="M6.75 8.5V6a3.25 3.25 0 0 1 6.5 0v2.5" />
              </svg>
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-texto font-semibold">
                Esta aula é exclusiva para assinantes
              </p>
              <p className="text-texto-2 text-sm leading-relaxed">
                Escolha um plano abaixo para liberar o acervo completo. Você
                volta direto para o conteúdo depois.
              </p>
            </div>
          </div>

          <Link
            href={destinoVolta}
            className="text-acento hover:text-acento-claro text-sm font-semibold transition-colors"
          >
            ← Voltar para o conteúdo
          </Link>
        </div>
      )}

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

                {temAssinaturaAtiva || ehCortesia ? (
                  <p className="text-texto-3 mt-auto text-sm">
                    {ehCortesia
                      ? "Seu acesso de cortesia já cobre tudo isto."
                      : "Você já assina a plataforma."}
                  </p>
                ) : (
                  <CheckoutAssinatura
                    plano={plano}
                    destinoAposAssinar={veioDeBloqueio ? destinoVolta : undefined}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/*
        O gateway é o Mercado Pago, por Checkout Transparente: `POST
        /assinatura` exige `cardToken`, que só existe tokenizando o cartão no
        navegador. Os campos de Stripe que sobraram nos planos (`priceId`,
        `stripeProductId`) são de uma integração anterior e não são usados.
      */}
      <p className="text-texto-3 text-sm">
        Pagamento processado pelo Mercado Pago. Os dados do cartão não passam
        pelos servidores da Digital Educa.
      </p>
    </div>
  );
}
