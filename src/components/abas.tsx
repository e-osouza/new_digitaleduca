import Link from "next/link";

/**
 * Abas navegáveis por URL (`?aba=`). Não usamos estado no cliente de propósito:
 * assim cada aba busca só os seus dados no servidor, o endereço é
 * compartilhável e o `router.refresh()` que os formulários disparam ao salvar
 * mantém a aba aberta.
 *
 * A marcação é de navegação, não `role="tablist"`: são links que trocam a
 * página, e `aria-current` descreve isso com honestidade para o leitor de tela.
 */
export function Abas({
  base,
  atual,
  itens,
  parametro = "aba",
}: {
  base: string;
  atual: string;
  itens: readonly { chave: string; rotulo: string }[];
  parametro?: string;
}) {
  return (
    <nav
      aria-label="Seções"
      /*
       * A calha negativa deixa a linha de baixo sangrar até a borda no celular
       * enquanto o conteúdo rola, em vez de cortar a última aba no meio.
       */
      className="border-borda-suave -mx-1 flex gap-1 overflow-x-auto border-b px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {itens.map((item) => {
        const ativo = item.chave === atual;

        return (
          <Link
            key={item.chave}
            href={`${base}?${parametro}=${item.chave}`}
            aria-current={ativo ? "page" : undefined}
            scroll={false}
            className={`relative -mb-px flex min-h-11 shrink-0 items-center border-b-2 px-4 text-sm font-semibold ${
              ativo
                ? "border-acento text-acento"
                : "text-texto-3 hover:text-texto border-transparent"
            }`}
          >
            {item.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
