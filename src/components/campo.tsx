export function Campo({
  id,
  rotulo,
  dica,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  rotulo: string;
  dica?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-texto-2 text-sm font-medium">
        {rotulo}
      </label>
      <input
        id={id}
        {...props}
        className="bg-superficie border-borda text-texto placeholder:text-texto-3 focus:border-acento focus:ring-acento/25 rounded-lg border px-3.5 py-2.5 text-sm transition-[border-color,box-shadow] outline-none focus:ring-2"
      />
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
