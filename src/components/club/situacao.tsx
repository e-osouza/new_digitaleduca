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

  const largura =
    time.limite > 0
      ? Math.min(100, Math.round((time.vagasUsadas / time.limite) * 100))
      : 0;

  return (
    <section
      className={`flex flex-col gap-5 rounded-2xl border p-5 sm:p-6 ${
        acabando
          ? "border-alerta/40 bg-alerta/10"
          : "border-borda bg-superficie"
      }`}
    >
      {/*
        Situação e vagas num bloco só.
        
        Eram dois cartões da mesma altura, um sobre o outro, e a tela virava
        uma pilha em que nada liderava. São a mesma pergunta em duas metades —
        "meu Club está de pé, e quanto dele já usei" —, então respondem juntas.
      */}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-display flex flex-wrap items-center gap-x-2 text-base font-semibold">
            Club ativo
            {dias !== null && (
              <span className="text-texto-3 text-sm font-normal">
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
        </div>

        <p className="text-texto-2 shrink-0 text-sm tabular-nums">
          <strong className="text-texto font-semibold">
            {time.vagasUsadas}
          </strong>{" "}
          de {time.limite} vagas
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div
          className="bg-superficie-2 h-2 overflow-hidden rounded-full"
          role="img"
          aria-label={`${time.vagasUsadas} de ${time.limite} vagas em uso`}
        >
          <div
            className="bg-acento-claro ease-suave h-full rounded-full transition-[width] duration-500"
            style={{ width: `${largura}%` }}
          />
        </div>

        {/*
          Os três números viraram legenda da barra, e não três caixas grandes.
          Eram o mesmo fato dito pela terceira vez — depois do "2 de 10" e da
          própria barra —, e o tamanho que tinham dava a eles um peso que a
          informação não tem.
        */}
        <p className="text-texto-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs tabular-nums">
          <span>
            <strong className="text-texto-2 font-semibold">
              {time.membros.length}
            </strong>{" "}
            no time
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong className="text-texto-2 font-semibold">
              {time.convites.length}
            </strong>{" "}
            aguardando
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong className="text-texto-2 font-semibold">
              {time.vagasRestantes}
            </strong>{" "}
            {time.vagasRestantes === 1 ? "livre" : "livres"}
          </span>
        </p>
      </div>

      {acabando && (
        <p className="text-texto-2 text-sm">
          Quando o período terminar, o time inteiro perde o acesso no mesmo
          instante. Renovando antes, ninguém precisa ser convidado de novo.
        </p>
      )}
    </section>
  );
}
