import "server-only";

/**
 * Limitador de chamadas em memória, para os endpoints que disparam e-mail.
 *
 * `/api/email/enviar` e `/api/senha/solicitar` são públicos por natureza — o
 * `proxy.ts` não cobre `/api`, e nem poderia: quem pede um código de
 * confirmação ou de redefinição ainda não tem sessão. Sem limite, os dois viram
 * um canhão para encher a caixa de entrada de qualquer endereço cadastrado, de
 * graça e a partir de qualquer lugar.
 *
 * RESSALVA IMPORTANTE: a contagem vive no processo. Com várias instâncias, cada
 * uma tem a sua, e o teto efetivo é o dobro, o triplo — o tanto de instâncias
 * que houver. Isto é um freio contra o abuso trivial, não uma defesa completa:
 * o limite definitivo pertence à API, que é quem realmente manda o e-mail.
 */

/** Momentos (epoch ms) das chamadas recentes de cada chave. */
const chamadas = new Map<string, number[]>();

/**
 * Teto de chaves guardadas. Um atacante variando o e-mail a cada tentativa faria
 * o mapa crescer sem parar; ao encostar no teto, esvaziamos tudo. Perder a
 * contagem é aceitável — o pior caso é o limite reiniciar, que é exatamente o
 * que aconteceria sem nenhum limitador.
 */
const MAXIMO_CHAVES = 5000;

export type Regra = {
  /** Tamanho da janela deslizante, em segundos. */
  janela: number;
  /** Quantas chamadas cabem na janela. */
  maximo: number;
};

/**
 * Registra uma chamada e diz se ela passou do teto.
 *
 * Devolve `true` quando a chamada deve ser RECUSADA. A contagem é registrada de
 * qualquer forma: insistir durante o bloqueio mantém o bloqueio, que é o
 * comportamento desejado.
 */
export function excedeuLimite(chave: string, { janela, maximo }: Regra): boolean {
  const agora = Date.now();
  const corte = agora - janela * 1000;

  if (chamadas.size > MAXIMO_CHAVES) chamadas.clear();

  const recentes = (chamadas.get(chave) ?? []).filter((momento) => momento > corte);
  recentes.push(agora);
  chamadas.set(chave, recentes);

  return recentes.length > maximo;
}

/**
 * Identifica quem está chamando, para limitar por origem além de por e-mail.
 *
 * `x-forwarded-for` é o que o proxy à frente da aplicação preenche; o primeiro
 * endereço da lista é o do cliente. Sem ele — desenvolvimento local, por
 * exemplo — todo mundo cai no mesmo balde, o que só torna o limite mais
 * rigoroso, nunca mais frouxo.
 */
export function origemDaChamada(request: Request): string {
  const encaminhado = request.headers.get("x-forwarded-for");
  const primeiro = encaminhado?.split(",")[0]?.trim();
  return primeiro || request.headers.get("x-real-ip") || "desconhecida";
}
