import type { MeuTime } from "@/types/api";

const data = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

/** Dias inteiros entre hoje e a data — negativo quando já passou. */
function diasAte(iso: string) {
  const dia = 24 * 60 * 60 * 1000;
  const alvo = new Date(iso).setHours(0, 0, 0, 0);
  const hoje = new Date().setHours(0, 0, 0, 0);
  return Math.round((alvo - hoje) / dia);
}

/**
 * O cartão que responde "meu Club está de pé?" antes de qualquer outra coisa.
 *
 * Fica no topo porque é a pergunta que governa o resto da tela: com a
 * participação vencida, o time continua listado mas não vê nada — e sem esta
 * explicação a lista de membros pareceria estar funcionando.
 */
export function SituacaoDoClub({ time }: { time: MeuTime }) {
  const fim = time.periodo?.dataFim ?? null;
  const dias = fim ? diasAte(fim) : null;

  /* Aviso de fim próximo: perto o bastante para agir, longe o bastante para dar tempo. */
  const acabando = time.ativo && dias !== null && dias <= 30;

  if (!time.ativo) {
    return (
      <section className="border-alerta/40 bg-alerta/10 flex flex-col gap-2 rounded-2xl border p-5 sm:p-6">
        <h2 className="text-alerta font-display text-base font-semibold">
          Sua participação no Club não está ativa
        </h2>
        <p className="text-texto-2 text-sm">
          {fim
            ? `O período terminou em ${data.format(new Date(fim))}. `
            : "Não há um período válido gravado. "}
          Enquanto isso, seu time continua aqui, mas ninguém do time vê o
          conteúdo — o acesso deles vem do seu.
        </p>
        <p className="text-texto-3 text-sm">
          Fale com a equipe da Digital Educa para renovar. Assim que o Club
          voltar, todo mundo do time recupera o acesso na hora, sem precisar
          convidar de novo.
        </p>
      </section>
    );
  }

  return (
    <section
      className={`flex flex-col gap-2 rounded-2xl border p-5 sm:p-6 ${
        acabando
          ? "border-alerta/40 bg-alerta/10"
          : "border-borda bg-superficie"
      }`}
    >
      <h2 className="font-display text-base font-semibold">
        Club ativo
        {dias !== null && (
          <span className="text-texto-3 ml-2 text-sm font-normal">
            {dias === 0
              ? "· último dia"
              : dias === 1
                ? "· falta 1 dia"
                : `· faltam ${dias} dias`}
          </span>
        )}
      </h2>

      <p className="text-texto-2 text-sm">
        {fim ? (
          <>
            Seu time vê todo o conteúdo até{" "}
            <strong className="text-texto font-semibold">
              {data.format(new Date(fim))}
            </strong>
            .
          </>
        ) : (
          "Seu time vê todo o conteúdo enquanto sua participação estiver ativa."
        )}
      </p>

      {acabando && (
        <p className="text-texto-2 text-sm">
          Quando o período terminar, o time inteiro perde o acesso no mesmo
          instante. Renovando antes, ninguém precisa ser convidado de novo.
        </p>
      )}
    </section>
  );
}
