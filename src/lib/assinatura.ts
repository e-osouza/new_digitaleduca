import type { Plano } from "@/types/api";

/**
 * Preço de um plano em cada número de parcelas.
 *
 * A regra é do backend, e está escrita no `CreateAssinaturaDto`: **em 1x
 * aplica-se o desconto à vista do plano; em 2x ou mais cobra-se o valor
 * cheio**, como pagamento avulso no cartão salvo. Não é o desconto sumindo por
 * capricho — são dois produtos diferentes no Mercado Pago: 1x cria assinatura
 * recorrente, 2x+ cria uma cobrança única parcelada.
 *
 * Por isso a diferença precisa aparecer na tela ANTES de a pessoa escolher.
 * O plano Anual custa R$ 867,00 cheio e R$ 780,30 à vista: quem escolhe 12x
 * paga R$ 86,70 a mais no total, e tem o direito de ver isso na hora de
 * decidir, não na fatura.
 */

/** Centavos, para a conta não passar por ponto flutuante. */
function emCentavos(reais: number) {
  return Math.round(reais * 100);
}

export type Cobranca = {
  parcelas: number;
  /** Total efetivamente cobrado, em reais. */
  total: number;
  /** Valor de cada parcela, em reais. */
  valorParcela: number;
  /** Quanto se economiza em relação ao valor cheio. Zero no parcelado. */
  desconto: number;
  /** Só o 1x é assinatura recorrente; o resto é cobrança única. */
  recorrente: boolean;
};

/**
 * Todas as opções de parcelamento de um plano, do 1x ao teto dele.
 *
 * Plano sem `permiteParcelamento` devolve só a opção à vista — é o caso do
 * mensal, que não faria sentido parcelar.
 *
 * `percentualCupom` reproduz a ordem das contas do backend, e a ordem importa:
 * o cupom incide sobre o preço cheio primeiro, e só depois o desconto à vista
 * multiplica o que sobrou. Inverter daria outro número, e o valor na tela
 * discordaria da fatura.
 */
export function opcoesDeCobranca(
  plano: Plano,
  percentualCupom = 0,
): Cobranca[] {
  /*
   * Mesmo arredondamento do `cupom.service.arredondar`: duas casas, a cada
   * etapa. Calcular tudo de uma vez e arredondar no fim erraria centavos em
   * alguns cupons.
   */
  const comCupom = percentualCupom
    ? Math.round(plano.preco * (1 - percentualCupom / 100) * 100) / 100
    : plano.preco;

  const cheioCent = emCentavos(comCupom);
  const descontoCent = Math.round(
    (cheioCent * (plano.percentualDescontoAVista || 0)) / 100,
  );

  const aVista: Cobranca = {
    parcelas: 1,
    total: (cheioCent - descontoCent) / 100,
    valorParcela: (cheioCent - descontoCent) / 100,
    desconto: descontoCent / 100,
    recorrente: true,
  };

  if (!plano.permiteParcelamento || plano.maxParcelas <= 1) return [aVista];

  const parceladas: Cobranca[] = [];
  for (let n = 2; n <= plano.maxParcelas; n++) {
    parceladas.push({
      parcelas: n,
      total: cheioCent / 100,
      /*
       * Arredondado só para exibir. Quem divide o centavo que sobra é o
       * Mercado Pago, na hora de gerar as parcelas — repetir essa conta aqui
       * criaria uma segunda verdade que uma hora discorda da fatura.
       */
      valorParcela: Math.round(cheioCent / n) / 100,
      desconto: 0,
      recorrente: false,
    });
  }

  return [aVista, ...parceladas];
}

/**
 * CPF é exigido pelo backend no parcelado (`payerDoc`), porque o pagamento
 * avulso do Mercado Pago precisa do documento do titular. Em 1x não é pedido.
 */
export function exigeCpf(cobranca: Cobranca) {
  return !cobranca.recorrente;
}

/** Só os 11 dígitos, do jeito que a API espera. */
export function digitosDoCpf(valor: string) {
  return valor.replace(/\D/g, "").slice(0, 11);
}

/** 000.000.000-00 enquanto se digita. */
export function formatarCpf(valor: string) {
  const d = digitosDoCpf(valor);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * Validação de CPF pelos dígitos verificadores.
 *
 * Vale a pena checar aqui: o Mercado Pago recusa o pagamento com um erro
 * genérico, e a pessoa ficaria olhando "pagamento recusado" sem saber que
 * errou um número do documento.
 */
export function cpfValido(valor: string) {
  const d = digitosDoCpf(valor);
  if (d.length !== 11) return false;
  // Todos os dígitos iguais passam na conta abaixo, mas nenhum é CPF real.
  if (/^(\d)\1{10}$/.test(d)) return false;

  const digito = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(d[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}
