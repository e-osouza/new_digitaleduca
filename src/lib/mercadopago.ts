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

type Mp = {
  fields: {
    create: (tipo: string, opcoes?: Record<string, unknown>) => CampoSeguro;
    createCardToken: (dados: {
      cardholderName: string;
      identificationType?: string;
      identificationNumber?: string;
    }) => Promise<{ id: string }>;
  };
  getIdentificationTypes: () => Promise<unknown>;
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
): Promise<string> {
  const cpf = (dados.cpf ?? "").replace(/\D/g, "");

  const resposta = await mp.fields.createCardToken({
    cardholderName: dados.titular.trim(),
    ...(cpf.length === 11
      ? { identificationType: "CPF", identificationNumber: cpf }
      : {}),
  });

  if (!resposta?.id) throw new Error("Não foi possível validar o cartão.");
  return resposta.id;
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
