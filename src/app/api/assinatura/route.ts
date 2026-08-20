import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

/**
 * Contrata a assinatura em `POST /assinatura`.
 *
 * O que passa por aqui é o `cardToken` — um identificador de uso único gerado
 * pelo Mercado Pago no NAVEGADOR, com a Public Key. Número do cartão, CVV e
 * validade nunca chegam a este servidor nem à API DigitalEduca: é o que
 * mantém a plataforma fora do escopo de PCI.
 *
 * A rota existe, em vez de o browser falar direto com a API, pelo mesmo motivo
 * de todas as outras: o JWT vive num cookie httpOnly e o JavaScript não o
 * alcança.
 */
export async function POST(request: Request) {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  let corpo: {
    planoId?: unknown;
    cardToken?: unknown;
    installments?: unknown;
    payerDoc?: unknown;
    cardBrand?: unknown;
    cardLast4?: unknown;
    cardExpMonth?: unknown;
    cardExpYear?: unknown;
    cartaoNome?: unknown;
  };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const planoId = Number(corpo.planoId);
  const cardToken = String(corpo.cardToken ?? "").trim();
  const parcelas = Math.max(1, Math.floor(Number(corpo.installments ?? 1)) || 1);
  const cpf = String(corpo.payerDoc ?? "").replace(/\D/g, "");

  if (!Number.isInteger(planoId) || planoId <= 0) {
    return NextResponse.json({ erro: "Plano inválido." }, { status: 400 });
  }
  if (!cardToken) {
    return NextResponse.json(
      { erro: "Não recebemos os dados do cartão. Tente de novo." },
      { status: 400 },
    );
  }
  /*
   * O backend só EXIGE o CPF no parcelado, mas repassa `payerDoc` ao Mercado
   * Pago nos dois caminhos, e no Brasil o MP costuma recusar cartão sem a
   * identificação do pagador. Exigimos sempre.
   */
  if (cpf.length !== 11) {
    return NextResponse.json(
      { erro: "Informe o CPF do titular." },
      { status: 400 },
    );
  }

  /*
   * `metodoPagamento` vai fixo em CARTAO: é o único caminho que o contrato
   * garante hoje. O enum da API também aceita PIX, mas `cardToken` continua
   * obrigatório no DTO, então PIX não está realmente ligado.
   */
  const payload: Record<string, unknown> = {
    planoId,
    cardToken,
    metodoPagamento: "CARTAO",
    installments: parcelas,
    payerDoc: cpf,
  };

  /*
   * Metadados do cartão, quando o Mercado Pago os devolveu na tokenização.
   * Não são sigilosos — são os mesmos dados impressos na fatura — e a API os
   * grava na assinatura. Sem eles o painel mostra a linha do cartão vazia.
   */
  const texto2 = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s || undefined;
  };
  const numero = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

  const metadados = {
    cardBrand: texto2(corpo.cardBrand),
    cardLast4: texto2(corpo.cardLast4)?.slice(-4),
    cardExpMonth: numero(corpo.cardExpMonth),
    cardExpYear: numero(corpo.cardExpYear),
    cartaoNome: texto2(corpo.cartaoNome),
  };
  for (const [chave, valor] of Object.entries(metadados)) {
    if (valor !== undefined) payload[chave] = valor;
  }

  const resposta = await fetch(`${API_URL}/assinatura`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const texto = await resposta.text();
  let dados: unknown = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {
    dados = null;
  }

  if (!resposta.ok) {
    /*
     * A mensagem da API é a única pista real do motivo da recusa ("Mercado
     * Pago não configurado", "cartão recusado", "CPF inválido"), e vale mais
     * para quem está pagando do que um texto genérico nosso. Vai para o log
     * COM o payload — menos o cardToken, que é credencial de uso único e não
     * tem por que ficar gravado.
     */
    const mensagem =
      (dados as { message?: string | string[] } | null)?.message ?? "";
    const detalhe = Array.isArray(mensagem) ? mensagem.join(" · ") : mensagem;

    console.warn(
      `[assinatura] POST /assinatura devolveu ${resposta.status} para ` +
        `${JSON.stringify({ ...payload, cardToken: "[omitido]" })} — ${texto.slice(0, 400)}`,
    );

    return NextResponse.json(
      {
        erro:
          detalhe ||
          "Não foi possível concluir a assinatura. Confira os dados e tente de novo.",
      },
      { status: resposta.status },
    );
  }

  return NextResponse.json({ ok: true, assinatura: dados });
}
