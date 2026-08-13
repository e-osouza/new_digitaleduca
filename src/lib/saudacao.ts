/** Fuso da plataforma. O público é brasileiro; ver a nota em `saudacao`. */
const FUSO = "America/Sao_Paulo";

/** Metade do dia em que estamos, para o cabeçalho escolher entre sol e lua. */
export type Periodo = "dia" | "noite";

/**
 * "Bom dia, Fulano" conforme a hora.
 *
 * Resolvida no SERVIDOR, e num fuso fixo, por dois motivos:
 *
 * 1. O `AppShell` é um componente de cliente. Calcular a hora durante a
 *    renderização faria o servidor (UTC, na VPS) e o navegador (hora local)
 *    chegarem a textos diferentes — divergência de hidratação, com o React
 *    reclamando e mantendo o valor errado do servidor.
 * 2. Fixar `America/Sao_Paulo` evita depender do fuso da máquina que serve.
 *
 * O limite disso: quem acessar de outro fuso vê a saudação do horário de
 * Brasília. Para uma plataforma de educação corporativa brasileira é uma troca
 * aceitável — a alternativa seria calcular após a montagem no cliente, o que
 * deixaria o cabeçalho vazio no primeiro quadro.
 *
 * Usa só o primeiro nome: "Bom dia, Maria Fernanda de Almeida" não cabe num
 * cabeçalho e soa protocolar.
 */
export function saudacao(
  nome: string | null,
  agora = new Date(),
): { texto: string; periodo: Periodo } {
  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: FUSO,
    }).format(agora),
  );

  /*
   * Três períodos, e não os dois do pedido: em português "Bom dia" às 15h está
   * errado, e a tarde é justamente o horário de maior uso.
   */
  const cumprimento =
    hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  const primeiro = nome?.trim().split(/\s+/)[0];

  return {
    texto: primeiro ? `${cumprimento}, ${primeiro}` : cumprimento,
    // Sol cobre manhã e tarde; a lua entra só quando escurece.
    periodo: hora < 18 ? "dia" : "noite",
  };
}
