import { formatarData } from "@/lib/format";
import type { Assinatura } from "@/types/api";

/**
 * Cartão de situação no alto da tela de planos.
 *
 * Quem já tem acesso — assinante ou cortesia — chegava aqui e via a mesma
 * tabela de preços de quem não tem, com a única pista sendo uma linha cinza de
 * apoio abaixo do título. Quem paga merece ser reconhecido antes de qualquer
 * outra coisa na página, e quem tem cortesia precisa saber ATÉ QUANDO ela
 * vale — a data existia na API e não aparecia em lugar nenhum.
 *
 * Verde, e não o acento da marca: aqui a mensagem é "está tudo certo", que é
 * o mesmo papel do `sucesso` no resto da plataforma. O acento é a cor de
 * ação, e não há ação a tomar quando o acesso já está liberado.
 */
export function SituacaoAssinatura({
  assinatura,
  ehCortesia,
}: {
  assinatura: Assinatura | null;
  /** Cortesia e assinatura paga dizem coisas diferentes — ver abaixo. */
  ehCortesia: boolean;
}) {
  const ate = assinatura?.dataFim ? formatarData(assinatura.dataFim) : null;
  const plano = assinatura?.plano?.trim();

  /*
   * Na cortesia o nome do plano fica de fora, e de propósito.
   *
   * O banco exige um `planoId` para criar a assinatura, então toda cortesia
   * acaba amarrada a algum plano — em geral o primeiro pago. Exibir isso diria
   * "Plano Mensal" a quem não assinou plano nenhum, e ainda ao lado de uma
   * validade de um ano, que não é a do mensal. O que importa na cortesia é até
   * quando ela vale.
   */
  const detalhe = [
    ...(!ehCortesia && plano ? [`Plano ${plano}`] : []),
    ...(ate ? [`${ehCortesia ? "Válido até" : "Renova em"} ${ate}`] : []),
  ];

  return (
    <section
      aria-label="Sua situação"
      className="border-sucesso/35 bg-sucesso/10 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6"
    >
      <span
        aria-hidden="true"
        className="bg-sucesso/15 text-sucesso flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14"
      >
        {ehCortesia ? <IconePresente /> : <IconeMembro />}
      </span>

      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-display text-lg font-semibold tracking-tight text-balance sm:text-xl">
          {ehCortesia
            ? "Seu acesso é uma cortesia"
            : "Você é membro do Digital Club"}
        </p>

        <p className="text-texto-2 text-sm leading-relaxed">
          {ehCortesia
            ? "Todo o acervo está liberado para você, sem custo."
            : "Todo o acervo está liberado — cursos, trilhas, MasterClass e podcasts."}
        </p>

        {/*
          A linha de detalhe só aparece quando há o que dizer. Numa cortesia
          sem data de fim, inventar "por tempo indeterminado" seria afirmar
          mais do que a API afirma.
        */}
        {detalhe.length > 0 && (
          <p className="text-texto-3 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {detalhe.map((pedaco, i) => (
              <span key={pedaco} className="flex items-center gap-x-2">
                {i > 0 && <span aria-hidden="true">·</span>}
                <span className="tabular-nums">{pedaco}</span>
              </span>
            ))}
          </p>
        )}
      </div>
    </section>
  );
}

/** Laço de presente — cortesia. */
function IconePresente() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6 sm:h-7 sm:w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 11h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z" />
      <path d="M3 7.5h18V11H3V7.5Z" />
      <path d="M12 7.5V21" />
      <path d="M12 7.5S10.5 3 8 3a2.25 2.25 0 0 0 0 4.5h4Z" />
      <path d="M12 7.5S13.5 3 16 3a2.25 2.25 0 0 1 0 4.5h-4Z" />
    </svg>
  );
}

/** Selo com visto — assinatura ativa. */
function IconeMembro() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6 sm:h-7 sm:w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2.5 14.7 5l3.6-.4.9 3.5 3 2.1-1.8 3.2 1 3.5-3.5 1-1.8 3.2-3.2-1.6-3.2 1.6-1.8-3.2-3.5-1 1-3.5L3.8 10l3-2.1.9-3.5L11.3 5 12 2.5Z" />
      <path d="m8.8 12.2 2.2 2.2 4.2-4.4" />
    </svg>
  );
}
