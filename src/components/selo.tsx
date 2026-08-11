const VARIACOES = {
  neutro: "bg-superficie-2 text-texto-2 border-borda",
  acento: "bg-acento/15 text-acento-claro border-acento/40",
  gratis: "bg-sucesso/15 text-sucesso border-sucesso/40",
} as const;

export function Selo({
  children,
  variacao = "neutro",
}: {
  children: React.ReactNode;
  variacao?: keyof typeof VARIACOES;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${VARIACOES[variacao]}`}
    >
      {children}
    </span>
  );
}
