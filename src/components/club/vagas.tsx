import type { MeuTime } from "@/types/api";

/**
 * Quanto do time já está ocupado.
 *
 * A barra é reforço, não a informação: os números vêm escritos ao lado, porque
 * uma barra sozinha não diz "7 de 10" para quem não enxerga a proporção — e
 * cor nenhuma aqui carrega significado sozinha.
 */
export function Vagas({ time }: { time: MeuTime }) {
  const proporcao = time.limite > 0 ? time.vagasUsadas / time.limite : 0;
  const largura = Math.min(100, Math.round(proporcao * 100));

  return (
    <section className="border-borda bg-superficie flex flex-col gap-4 rounded-2xl border p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-semibold">Vagas</h2>
        <p className="text-texto-2 text-sm tabular-nums">
          <strong className="text-texto font-semibold">
            {time.vagasUsadas}
          </strong>{" "}
          de {time.limite} em uso
        </p>
      </div>

      <div
        className="bg-superficie-2 h-2 overflow-hidden rounded-full"
        role="img"
        aria-label={`${time.vagasUsadas} de ${time.limite} vagas em uso`}
      >
        <div
          className="bg-acento-claro h-full rounded-full"
          style={{ width: `${largura}%` }}
        />
      </div>

      <dl className="grid grid-cols-3 gap-3 text-center">
        <Numero rotulo="No time" valor={time.membros.length} />
        <Numero rotulo="Aguardando" valor={time.convites.length} />
        <Numero rotulo="Livres" valor={time.vagasRestantes} />
      </dl>
    </section>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="bg-fundo-2 flex flex-col gap-0.5 rounded-xl px-3 py-3">
      <dt className="text-texto-3 order-2 text-xs">{rotulo}</dt>
      <dd className="font-display text-texto order-1 text-2xl font-semibold tabular-nums">
        {valor}
      </dd>
    </div>
  );
}
