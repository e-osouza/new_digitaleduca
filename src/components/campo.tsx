export function Campo({
  id,
  rotulo,
  dica,
  icone,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  rotulo: string;
  dica?: string;
  /**
   * Sinal decorativo no fim da caixa — o envelope do e-mail, por exemplo.
   * Decorativo mesmo: quem informa o que o campo quer é o `<label>`, e um
   * desenho não substitui rótulo. Serve para dar ao campo a mesma silhueta do
   * de senha, que tem o botão de revelar no mesmo lugar.
   */
  icone?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-texto-2 text-sm font-medium">
        {rotulo}
      </label>

      <div className="relative">
        <input
          id={id}
          {...props}
          className={`bg-superficie border-borda text-texto placeholder:text-texto-3 focus:border-acento focus:ring-acento/25 w-full rounded-lg border py-2.5 pl-3.5 text-sm transition-[border-color,box-shadow] outline-none focus:ring-2 ${
            icone ? "pr-11" : "pr-3.5"
          }`}
        />

        {icone && (
          <span
            aria-hidden="true"
            className="text-texto-3 pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2"
          >
            {icone}
          </span>
        )}
      </div>

      {dica && <p className="text-texto-3 text-xs">{dica}</p>}
    </div>
  );
}

export function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="border-alerta/40 bg-alerta/10 text-alerta rounded-lg border px-3.5 py-2.5 text-sm"
    >
      {children}
    </p>
  );
}

/**
 * Aviso informativo, para o que não é erro — a sessão que expirou, por exemplo.
 *
 * Antes essa mensagem vinha como texto apagado (`text-texto-3`), com MENOS
 * destaque que o corpo da página, quando é justamente a explicação de por que
 * a pessoa foi parar ali.
 */
export function Nota({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="border-acento/30 bg-acento/8 text-texto-2 rounded-lg border px-3.5 py-2.5 text-sm"
    >
      {children}
    </p>
  );
}
