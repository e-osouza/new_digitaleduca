/** Bloco cinza pulsante usado enquanto os dados não chegaram. */
export function Esqueleto({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-superficie animate-pulsar rounded ${className}`}
    />
  );
}

/** Card de conteúdo em estado de carregamento. */
export function EsqueletoCard({ largura = "card-trilho" }: { largura?: string }) {
  return (
    <div className={`${largura} flex shrink-0 flex-col gap-2.5`}>
      <Esqueleto className="aspect-video w-full rounded-xl" />
      <Esqueleto className="h-3 w-20" />
      <Esqueleto className="h-4 w-full" />
      <Esqueleto className="h-4 w-2/3" />
    </div>
  );
}

/** Faixa horizontal de cards em carregamento. */
export function EsqueletoTrilho({ quantidade = 5 }: { quantidade?: number }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="calha w-full">
        <Esqueleto className="h-7 w-48" />
      </div>
      {/* `trilho` também define as variáveis de largura usadas por card-trilho. */}
      <div className="trilho calha flex gap-3 overflow-hidden pb-2 sm:gap-4">
        {Array.from({ length: quantidade }, (_, indice) => (
          <EsqueletoCard key={indice} />
        ))}
      </div>
    </section>
  );
}

/** Grade de cards em carregamento. */
export function EsqueletoGrade({
  quantidade = 10,
  colunas = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
}: {
  quantidade?: number;
  colunas?: string;
}) {
  return (
    <div className={`grid gap-x-4 gap-y-8 ${colunas}`}>
      {Array.from({ length: quantidade }, (_, indice) => (
        <EsqueletoCard key={indice} largura="w-full" />
      ))}
    </div>
  );
}
