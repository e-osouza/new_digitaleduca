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
        className="bg-superficie border-borda text-texto placeholder:text-texto-3 focus:border-acento rounded-lg border px-3.5 py-2.5 text-sm transition-colors outline-none"
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
