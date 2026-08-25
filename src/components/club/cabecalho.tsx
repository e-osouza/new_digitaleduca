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
 * A abertura da página do Club: marca, situação e vagas num bloco só.
 *
 * O Club é o produto mais caro da plataforma e chegava numa tela igual à de
 * Configurações — um <h1> seco, uma linha de apoio e cartões brancos. Aqui a
 * página ganha uma peça de entrada: a pedra da marca em medalhão, o estado da
 * participação num selo e a capacidade do time logo abaixo.
 *
 * O título mora aqui, e não na página, porque estas quatro informações são uma
 * frase só — "este é o seu Club, ele está de pé, e você já usou tanto dele".
 * Separá-las em header + cartão era o que fazia a tela abrir sem centro.
 */
export function CabecalhoClub({ time }: { time: MeuTime }) {
  const fim = time.periodo?.dataFim ?? null;
  const dias = fim ? diasAte(fim) : null;

  /* Aviso de fim próximo: perto o bastante para agir, longe o bastante para dar tempo. */
  const acabando = time.ativo && dias !== null && dias <= 30;

  const largura =
    time.limite > 0
      ? Math.min(100, Math.round((time.vagasUsadas / time.limite) * 100))
      : 0;

  const prazo =
    dias === null
      ? null
      : dias <= 0
        ? "último dia"
        : dias === 1
          ? "falta 1 dia"
          : `faltam ${dias} dias`;

  return (
    <header className="border-borda-suave bg-superficie relative overflow-hidden rounded-3xl border shadow-sm">
      {/*
        A lapidação da pedra, traduzida em luz: um brilho diagonal que sai do
        canto do medalhão e se apaga antes do meio. É o acento da marca a 12%,
        então acompanha o tema — no escuro ele vira o azul claro, e não uma
        mancha cinza sobre fundo preto.
      */}
      <div
        aria-hidden="true"
        className="from-acento/12 via-acento/4 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent"
      />

      <div className="relative flex flex-col gap-6 p-6 sm:gap-7 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div className="flex min-w-0 items-center gap-4">
            <span
              aria-hidden="true"
              className="bg-acento ring-acento/12 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white ring-6 sm:h-14 sm:w-14"
            >
              {/* A mesma pedra do menu — contorno, cintura e o V das facetas. */}
              <svg
                viewBox="0 0 20 20"
                className="h-6 w-6 sm:h-7 sm:w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6.5 3h7l3.5 4.5L10 17.3 3 7.5z" />
                <path d="M3 7.5h14" />
                <path d="M6.5 3 10 7.5 13.5 3" />
              </svg>
            </span>

            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-texto-3 text-[11px] font-semibold tracking-[0.14em] uppercase">
                Sua participação
              </p>
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Digital Club
              </h1>
            </div>
          </div>

          <Selo ativo={time.ativo} acabando={acabando} prazo={prazo} />
        </div>

        <p className="text-texto-2 max-w-prose text-sm leading-relaxed">
          {!time.ativo ? (
            <>
              {fim
                ? `O período terminou em ${data.format(new Date(fim))}. `
                : "Não há um período válido gravado. "}
              Seu time continua aqui, mas ninguém dele vê o conteúdo — o acesso
              deles vem do seu. Fale com a equipe da Digital Educa para renovar:
              quando o Club voltar, todo mundo recupera o acesso na hora, sem
              precisar ser convidado de novo.
            </>
          ) : fim ? (
            <>
              Quem está no seu time vê todo o conteúdo até{" "}
              <strong className="text-texto font-semibold">
                {data.format(new Date(fim))}
              </strong>
              .{" "}
              {acabando &&
                "Renovando antes, ninguém precisa ser convidado de novo."}
            </>
          ) : (
            "Quem está no seu time vê todo o conteúdo enquanto sua participação estiver ativa."
          )}
        </p>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-texto-3 text-[11px] font-semibold tracking-[0.14em] uppercase">
              Vagas
            </p>
            <p className="text-texto-2 text-sm tabular-nums">
              <strong className="text-texto font-semibold">
                {time.vagasUsadas}
              </strong>{" "}
              de {time.limite}
            </p>
          </div>

          <div
            className="bg-superficie-2 h-1.5 overflow-hidden rounded-full"
            role="img"
            aria-label={`${time.vagasUsadas} de ${time.limite} vagas em uso`}
          >
            {/*
              O degradê dá profundidade à barra sem inventar uma cor: são os
              dois tons de acento que o tema já define.
            */}
            <div
              className="from-acento to-acento-claro ease-suave h-full rounded-full bg-gradient-to-r transition-[width] duration-500"
              style={{ width: `${largura}%` }}
            />
          </div>

          {/*
            Os contadores são legenda da barra, e não caixas próprias: depois do
            "2 de 10" e do preenchimento, seriam o mesmo fato pela terceira vez.
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
      </div>
    </header>
  );
}

/**
 * O estado da participação em três palavras.
 *
 * Verde é "está tudo certo", e é o mesmo papel do `sucesso` no resto da
 * plataforma; o acento é cor de ação, e aqui não há ação a tomar. Quando o fim
 * se aproxima o selo migra para `alerta` — o mesmo aviso, antes de virar
 * problema.
 */
function Selo({
  ativo,
  acabando,
  prazo,
}: {
  ativo: boolean;
  acabando: boolean;
  prazo: string | null;
}) {
  const cor = !ativo
    ? "border-alerta/35 bg-alerta/10 text-alerta"
    : acabando
      ? "border-alerta/35 bg-alerta/10 text-alerta"
      : "border-sucesso/30 bg-sucesso/10 text-sucesso";

  return (
    <span
      className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${cor}`}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
      />
      {!ativo ? (
        "Participação vencida"
      ) : (
        <>
          Club ativo
          {prazo && <span className="font-normal opacity-80">· {prazo}</span>}
        </>
      )}
    </span>
  );
}
