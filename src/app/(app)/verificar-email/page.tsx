import type { Metadata } from "next";
import Link from "next/link";
import { normalizarMe, obterMe } from "@/lib/queries";
import { FormularioVerificarEmail } from "@/components/formulario-verificar-email";

export const metadata: Metadata = { title: "Confirmar e-mail" };

/*
 * A tela toma a altura livre abaixo da barra superior para o cartão ficar no
 * meio, e não encostado no topo de uma página vazia — aqui existe uma tarefa
 * só, então nada disputa o centro com ela.
 *
 * O desconto é a altura do cabeçalho do `AppShell` (`h-14`, `h-16` a partir de
 * `sm`). `min-h-full` seria o natural, mas o `template.tsx` interpõe uma div de
 * altura automática entre o `<main>` e a página, e porcentagem contra altura
 * automática não resolve.
 */
const ALTURA_LIVRE = "min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)]";

const CARTAO =
  "border-borda-suave bg-superficie flex w-full flex-col items-center gap-5 rounded-2xl border p-6 text-center sm:p-8";

const BOTAO =
  "bg-acento text-white hover:bg-acento-hover flex min-h-12 w-full items-center justify-center rounded-full px-6 text-sm font-bold transition-colors";

export default async function VerificarEmail() {
  const { usuario } = normalizarMe(await obterMe());

  return (
    <div className={`calha flex ${ALTURA_LIVRE} items-center justify-center py-10`}>
      <div className="flex w-full max-w-md flex-col items-center gap-5">
        {usuario?.emailVerified ? (
          <div className={CARTAO}>
            <Medalhao tom="sucesso">
              <circle cx="10" cy="10" r="7.5" />
              <path d="m6.4 10.2 2.4 2.4 4.8-5.2" />
            </Medalhao>

            <div className="flex flex-col gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                E-mail confirmado
              </h1>
              <p className="text-texto-3 text-sm">
                Tudo certo com a sua conta — não precisa fazer mais nada por aqui.
              </p>
            </div>

            <Link href="/inicio" className={BOTAO}>
              Voltar ao início
            </Link>
          </div>
        ) : usuario?.email ? (
          <>
            <div className={CARTAO}>
              <Medalhao tom="acento">
                <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
                <path d="m3 6.5 7 4.5 7-4.5" />
              </Medalhao>

              <div className="flex flex-col gap-2">
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                  Confirmar e-mail
                </h1>
                <p className="text-texto-3 text-sm">
                  Enviamos um código de 4 dígitos para{" "}
                  {/* `break-all`: e-mail comprido não pode estourar o cartão. */}
                  <strong className="text-texto-2 font-semibold break-all">
                    {usuario.email}
                  </strong>
                  .
                </p>
              </div>

              <FormularioVerificarEmail email={usuario.email} />
            </div>

            {/*
              Saída explícita. Quem acaba de se cadastrar cai aqui, e confirmar
              o e-mail não bloqueia o acesso ao catálogo — sem este link a tela
              pareceria um pedágio obrigatório. Fica FORA do cartão, para não
              competir com o botão que resolve a tarefa.
            */}
            <Link
              href="/inicio"
              className="text-texto-3 hover:text-acento min-h-11 text-sm transition-colors"
            >
              Deixar para depois e explorar o catálogo
            </Link>
          </>
        ) : (
          <div className={CARTAO}>
            <Medalhao tom="alerta">
              <circle cx="10" cy="10" r="7.5" />
              <path d="M10 6.2v4.4M10 13.4h.01" />
            </Medalhao>
            <p className="text-texto-3 text-sm">
              Não conseguimos carregar o e-mail da sua conta. Recarregue a página
              e tente de novo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Ícone redondo no topo do cartão. Decorativo: o título ao lado já diz o estado. */
function Medalhao({
  tom,
  children,
}: {
  tom: "acento" | "sucesso" | "alerta";
  children: React.ReactNode;
}) {
  const cores = {
    acento: "bg-acento/10 text-acento",
    sucesso: "bg-sucesso/12 text-sucesso",
    alerta: "bg-alerta/10 text-alerta",
  } as const;

  return (
    <span
      aria-hidden="true"
      className={`flex h-14 w-14 items-center justify-center rounded-full ${cores[tom]}`}
    >
      <svg
        viewBox="0 0 20 20"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </span>
  );
}
