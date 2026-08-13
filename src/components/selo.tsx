const VARIACOES = {
  neutro: "bg-superficie-2 text-texto-2 border-borda",
  acento: "bg-acento/15 text-acento-claro border-acento/40",
  /*
    Preenchimento sólido, e não o tom de 15% das outras variações: este selo
    fica sobre a capa do conteúdo, onde um fundo translúcido deixaria a foto
    aparecer por baixo e comeria a legibilidade. Branco sobre `gratis` dá
    5,3:1, acima do mínimo AA para texto pequeno.
  */
  gratis: "bg-gratis border-gratis text-white",
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
