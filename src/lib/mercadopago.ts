"use client";

/**
 * Tokenização de cartão no navegador, com o SDK v2 do Mercado Pago.
 *
 * O desenho vem do contrato da API: `POST /assinatura` exige `cardToken`, e o
 * próprio DTO diz que ele é "gerado no app com a Public Key". Isso descarta o
 * Checkout Pro (redirect) e define Checkout Transparente.
 *
 * O ponto que justifica toda a complexidade abaixo: os campos do cartão são
 * **Secure Fields**, iframes servidos pelo Mercado Pago. Número, CVV e
 * validade são digitados DENTRO do domínio deles — nosso JavaScript não lê
 * esses valores, nosso servidor não os recebe e a API DigitalEduca também
 * não. O que sai daqui é um token de uso único.
 *
 * Campos de texto comuns seriam mais simples de escrever e jogariam a
 * plataforma inteira para dentro do escopo de PCI-DSS. Não vale.
 */

const SDK = "https://sdk.mercadopago.com/js/v2";

/**
 * A chave é pública por natureza — ela nasce para viajar no cliente, e é por
 * isso que pode ser `NEXT_PUBLIC_`. O segredo do Mercado Pago é o Access
 * Token, que vive só no backend e nunca passa por aqui.
 */
export const CHAVE_PUBLICA = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? "";

export function mercadoPagoConfigurado() {
  return CHAVE_PUBLICA.length > 0;
}

/* ---- tipos mínimos do SDK, só o que usamos ---- */

type CampoSeguro = {
  mount: (id: string) => void;
  unmount: () => void;
  on: (evento: string, ouvinte: (dados: unknown) => void) => void;
};

type MetodoPagamento = {
  id?: string;
  name?: string;
  payment_type_id?: string;
  secure_thumbnail?: string;
  thumbnail?: string;
};

/** Bandeira reconhecida a partir dos primeiros dígitos. */
export type Bandeira = {
  id: string;
  nome: string;
  logo: string | null;
};

type RespostaToken = {
  id: string;
  first_six_digits?: string;
  last_four_digits?: string;
  expiration_month?: number;
  expiration_year?: number;
  cardholder?: { name?: string };
};

type Mp = {
  fields: {
    create: (tipo: string, opcoes?: Record<string, unknown>) => CampoSeguro;
    createCardToken: (dados: {
      cardholderName: string;
      identificationType?: string;
      identificationNumber?: string;
    }) => Promise<RespostaToken>;
  };
  getIdentificationTypes: () => Promise<unknown>;
  getPaymentMethods: (dados: { bin: string }) => Promise<{
    results?: MetodoPagamento[];
  }>;
};

/**
 * O que a API precisa saber do cartão além do token.
 *
 * Nada aqui é sigiloso — são os mesmos dados que o banco imprime na fatura, e
 * o próprio Mercado Pago devolve na tokenização. A API grava tudo na
 * assinatura, e é o que faz o painel mostrar "Mastercard •••• 6351" em vez de
 * uma linha vazia.
 */
export type DadosDoCartao = {
  cardToken: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  cartaoNome?: string;
};

declare global {
  interface Window {
    MercadoPago?: new (chave: string, opcoes?: { locale?: string }) => Mp;
  }
}

let carregando: Promise<void> | null = null;

/**
 * Injeta o script uma vez só. A promessa fica guardada porque a tela pode
 * montar o checkout mais de uma vez (abrir, fechar, trocar de plano) e cada
 * montagem pediria o SDK de novo.
 */
function carregarSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.MercadoPago) return Promise.resolve();
  if (carregando) return carregando;

  carregando = new Promise<void>((resolver, rejeitar) => {
    const existente = document.querySelector<HTMLScriptElement>(
      `script[src="${SDK}"]`,
    );
    if (existente) {
      existente.addEventListener("load", () => resolver());
      existente.addEventListener("error", () =>
        rejeitar(new Error("Falha ao carregar o Mercado Pago.")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = SDK;
    script.async = true;
    script.onload = () => resolver();
    script.onerror = () =>
      rejeitar(new Error("Falha ao carregar o Mercado Pago."));
    document.head.appendChild(script);
  }).catch((erro) => {
    // Sem isto, uma queda de rede deixaria a promessa rejeitada em cache e o
    // checkout nunca mais tentaria de novo enquanto a aba estivesse aberta.
    carregando = null;
    throw erro;
  });

  return carregando;
}

export async function iniciarMercadoPago(): Promise<Mp> {
  if (!CHAVE_PUBLICA) {
    throw new Error(
      "Pagamento indisponível: a chave pública do Mercado Pago não está configurada.",
    );
  }

  await carregarSdk();

  if (!window.MercadoPago) {
    throw new Error("Falha ao carregar o Mercado Pago.");
  }

  return new window.MercadoPago(CHAVE_PUBLICA, { locale: "pt-BR" });
}

export type CamposDoCartao = {
  numero: CampoSeguro;
  validade: CampoSeguro;
  cvv: CampoSeguro;
  desmontar: () => void;
};

/**
 * Monta os três campos seguros nos contêineres informados.
 *
 * O estilo é passado ao SDK porque o conteúdo mora num iframe: nosso CSS não
 * atravessa. Os valores abaixo vêm dos tokens do tema e são lidos do próprio
 * documento, para os campos acompanharem o tema claro e o escuro.
 */
export function montarCampos(
  mp: Mp,
  ids: { numero: string; validade: string; cvv: string },
): CamposDoCartao {
  const raiz = getComputedStyle(document.documentElement);
  const cor = (nome: string, reserva: string) =>
    raiz.getPropertyValue(nome).trim() || reserva;

  const estilo = {
    style: {
      color: cor("--color-texto", "#08192a"),
      "font-size": "16px",
      "font-family": "system-ui, sans-serif",
      placeholderColor: cor("--color-texto-3", "#5c7186"),
    },
  };

  const numero = mp.fields.create("cardNumber", {
    ...estilo,
    placeholder: "0000 0000 0000 0000",
  });
  const validade = mp.fields.create("expirationDate", {
    ...estilo,
    placeholder: "MM/AA",
  });
  const cvv = mp.fields.create("securityCode", { ...estilo, placeholder: "123" });

  numero.mount(ids.numero);
  validade.mount(ids.validade);
  cvv.mount(ids.cvv);

  return {
    numero,
    validade,
    cvv,
    desmontar: () => {
      // Cada um em seu try: se o primeiro falhar, os outros dois ainda saem —
      // iframes órfãos ficariam sobre a tela seguinte.
      for (const campo of [numero, validade, cvv]) {
        try {
          campo.unmount();
        } catch {
          /* já desmontado */
        }
      }
    },
  };
}

/**
 * Troca os dados digitados por um token de uso único.
 *
 * `identification*` só vai quando há CPF — o backend o exige no parcelado. Em
 * 1x o Mercado Pago não pede documento, e mandar um campo vazio faz o SDK
 * recusar com erro de validação.
 */
export async function gerarTokenDoCartao(
  mp: Mp,
  dados: { titular: string; cpf?: string },
): Promise<DadosDoCartao> {
  const cpf = (dados.cpf ?? "").replace(/\D/g, "");

  const resposta = await mp.fields.createCardToken({
    cardholderName: dados.titular.trim(),
    ...(cpf.length === 11
      ? { identificationType: "CPF", identificationNumber: cpf }
      : {}),
  });

  if (!resposta?.id) throw new Error("Não foi possível validar o cartão.");

  return {
    cardToken: resposta.id,
    cardBrand: await descobrirBandeira(mp, resposta.first_six_digits),
    cardLast4: resposta.last_four_digits,
    cardExpMonth: resposta.expiration_month,
    cardExpYear: resposta.expiration_year,
    cartaoNome: resposta.cardholder?.name ?? dados.titular.trim(),
  };
}

/**
 * Bandeira do cartão a partir do BIN (os seis primeiros dígitos).
 *
 * A tokenização não devolve a bandeira, e a API a repassa ao Mercado Pago como
 * `payment_method_id`. Não é obrigatória — sem ela o MP infere do próprio
 * token —, mas é ela que o painel exibe ao lado dos quatro últimos dígitos.
 *
 * Falha aqui não pode derrubar o pagamento: sem bandeira o checkout segue, e o
 * campo fica nulo como já ficava antes.
 */
async function descobrirBandeira(
  mp: Mp,
  bin: string | undefined,
): Promise<string | undefined> {
  return (await consultarBandeira(mp, bin))?.id;
}

/**
 * Bandeira, nome e logotipo a partir do BIN.
 *
 * O filtro por `payment_type_id` não é zelo excessivo: `getPaymentMethods`
 * devolve TUDO que a conta aceita quando não reconhece o BIN — Pix, boleto,
 * saldo em conta e o Mercado Crédito, que costuma vir PRIMEIRO. Pegar
 * `results[0]` às cegas mandaria `consumer_credits` como `payment_method_id`
 * da cobrança, e o Mercado Pago recusaria um pagamento de cartão anunciado
 * como crédito digital.
 *
 * Crédito antes de débito porque é o que a assinatura usa.
 */
export async function consultarBandeira(
  mp: Mp,
  bin: string | undefined,
): Promise<Bandeira | null> {
  if (!bin || bin.length < 6) return null;

  try {
    const r = await mp.getPaymentMethods({ bin });
    const cartoes = (r?.results ?? []).filter(
      (m) =>
        m.payment_type_id === "credit_card" || m.payment_type_id === "debit_card",
    );
    const escolhido =
      cartoes.find((m) => m.payment_type_id === "credit_card") ?? cartoes[0];

    if (!escolhido?.id) return null;

    return {
      id: escolhido.id,
      nome: escolhido.name ?? escolhido.id,
      logo: escolhido.secure_thumbnail ?? escolhido.thumbnail ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Avisa quando cada campo passa a ser válido — ou deixa de ser.
 *
 * É o Mercado Pago quem sabe: o conteúdo vive num iframe deles, e o nosso
 * JavaScript não lê um caractere sequer. O `validityChange` é o veredito
 * pronto, já considerando Luhn, bandeira e o comprimento certo de CADA
 * bandeira — 15 dígitos no Amex, 14 no Diners, 16 na maioria.
 *
 * Vale mais que tentar contar dígitos por fora: enquanto o BIN não é
 * reconhecido, o campo aceita até 20 dígitos, e nenhuma regra nossa de
 * comprimento acertaria todas as bandeiras. Com isto, o botão de pagar só
 * acende quando os três campos estão bons de verdade.
 */
export function observarValidade(
  campos: CamposDoCartao,
  aoMudar: (validade: { numero: boolean; validade: boolean; cvv: boolean }) => void,
) {
  const estado = { numero: false, validade: false, cvv: false };

  const ligar = (
    campo: CampoSeguro,
    chave: keyof typeof estado,
  ) => {
    campo.on("validityChange", (dados) => {
      /*
       * O evento traz a LISTA de erros do campo. Vazia — ou ausente — quer
       * dizer válido. Checar `errorMessages` em vez de um booleano é o que a
       * documentação do SDK descreve, e é o que o campo realmente manda.
       */
      const erros = (dados as { errorMessages?: unknown[] } | undefined)
        ?.errorMessages;
      estado[chave] = Array.isArray(erros) ? erros.length === 0 : Boolean(dados);
      aoMudar({ ...estado });
    });
  };

  ligar(campos.numero, "numero");
  ligar(campos.validade, "validade");
  ligar(campos.cvv, "cvv");
}

/**
 * Avisa a cada mudança nos primeiros dígitos digitados.
 *
 * O campo é um iframe do Mercado Pago — nosso JavaScript não lê o que a pessoa
 * digita. O `binChange` é a única janela que eles abrem: manda só o BIN (seis
 * dígitos), o suficiente para identificar a bandeira e nada perto de um número
 * de cartão.
 */
export function observarBandeira(
  mp: Mp,
  campos: CamposDoCartao,
  aoMudar: (bandeira: Bandeira | null) => void,
) {
  campos.numero.on("binChange", (dados) => {
    const bin = (dados as { bin?: string } | undefined)?.bin ?? "";
    if (bin.length < 6) {
      aoMudar(null);
      return;
    }
    void consultarBandeira(mp, bin).then(aoMudar);
  });
}

/**
 * Traduz os erros do SDK, que chegam em inglês e por código.
 *
 * Sem isto a pessoa vê "invalid_card_number" no meio de uma tela em português.
 * A lista cobre o que o SDK devolve na tokenização; recusa da operadora é
 * outra etapa e vem da API, já em português.
 */
export function traduzirErro(erro: unknown): string {
  const causas = (erro as { cause?: { code?: string }[] } | null)?.cause;
  const codigo = Array.isArray(causas) ? causas[0]?.code : undefined;

  const mapa: Record<string, string> = {
    "205": "Digite o número do cartão.",
    "208": "Escolha o mês de validade.",
    "209": "Escolha o ano de validade.",
    "212": "Informe o CPF do titular.",
    "214": "Informe o CPF do titular.",
    "220": "Informe o banco emissor.",
    "221": "Digite o nome como está no cartão.",
    "224": "Digite o código de segurança.",
    E301: "Número de cartão inválido.",
    E302: "Código de segurança inválido.",
    "316": "Nome do titular inválido.",
    "322": "CPF inválido.",
    "324": "CPF inválido.",
    "325": "Mês de validade inválido.",
    "326": "Ano de validade inválido.",
  };

  if (codigo && mapa[codigo]) return mapa[codigo];

  const mensagem = (erro as Error | null)?.message;
  if (mensagem && !/^\w+_\w+$/.test(mensagem)) return mensagem;

  return "Confira os dados do cartão e tente de novo.";
}
