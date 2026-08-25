import { NextResponse } from "next/server";

/**
 * Repassa o erro da API ao navegador preservando a MENSAGEM.
 *
 * No Club a mensagem é a informação toda — "seu time já usa 10 vagas",
 * "esta pessoa já está em outro time", "o convite expirou". Trocar tudo por
 * um genérico deixaria a tela sem ter o que dizer justamente nos casos que o
 * dono precisa resolver.
 */
export async function repassarErro(resposta: Response, padrao: string) {
  let mensagem = "";
  try {
    const corpo = (await resposta.json()) as { message?: string | string[] };
    mensagem = Array.isArray(corpo.message)
      ? corpo.message.join(", ")
      : (corpo.message ?? "");
  } catch {
    // segue sem mensagem
  }

  /*
    4xx são regras de negócio e voltam como vieram. 5xx viram 502 com texto
    neutro: o motivo interno não ajuda quem está do outro lado.
  */
  const status = resposta.status >= 400 && resposta.status < 500 ? 400 : 502;

  return NextResponse.json(
    { erro: status === 400 && mensagem ? mensagem : padrao },
    { status },
  );
}
