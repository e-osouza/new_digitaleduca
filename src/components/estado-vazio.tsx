/**
 * Moldura dos estados vazios da plataforma.
 *
 * Antes cada página desenhava uma caixa com borda, alinhada à esquerda, que
 * lia como "um card que não carregou". Aqui o vazio é assumido: nada de
 * moldura, o bloco fica centrado na área de conteúdo e a ilustração faz o
 * trabalho que o texto sozinho não fazia.
 *
 * O bloco CRESCE para ocupar a área que sobrou (`flex-1`) e se centra nela —
 * é o que o <main> e o template passaram a permitir. A altura mínima é o piso
 * para telas baixas, onde não sobra área para crescer.
 *
 * Por padrão o título sai como <h1>, porque na tela vazia ele É o título da
 * página: o cabeçalho some junto com o conteúdo que ele descrevia, e deixar o
 * <h1> lá em cima sozinho quebraria o eixo do bloco centrado. A ilustração é
 * `aria-hidden`, então na árvore de acessibilidade o <h1> continua vindo
 * primeiro, como em qualquer outra página. Onde o cabeçalho PRECISA ficar,
 * `nivel="secao"` evita o segundo <h1> — ver a prop.
 */
export function EstadoVazio({
  ilustracao,
  titulo,
  descricao,
  nivel = "pagina",
  children,
}: {
  ilustracao: React.ReactNode;
  titulo: string;
  descricao: React.ReactNode;
  /**
   * `pagina` (padrão): o estado vazio SUBSTITUI o cabeçalho, então o título
   * dele é o <h1> da página. `secao`: o cabeçalho continua em cena — como em
   * estatísticas, onde o filtro de período mora nele —, e aqui um segundo
   * <h1> seria um erro de estrutura.
   */
  nivel?: "pagina" | "secao";
  /** Ações — normalmente um botão levando ao caminho que preenche a tela. */
  children?: React.ReactNode;
}) {
  const Titulo = nivel === "secao" ? "h2" : "h1";

  return (
    <div className="flex min-h-[20rem] w-full flex-1 flex-col items-center justify-center gap-7 py-10 text-center">
      <div aria-hidden="true" className="w-[168px] sm:w-[196px]">
        {ilustracao}
      </div>

      <div className="flex max-w-md flex-col gap-2.5">
        <Titulo
          className={
            nivel === "secao"
              ? "font-display text-texto text-lg font-semibold text-balance"
              : "font-display text-xl font-semibold tracking-tight text-balance sm:text-2xl lg:text-3xl"
          }
        >
          {titulo}
        </Titulo>
        <p className="text-texto-3 text-sm leading-relaxed text-pretty">
          {descricao}
        </p>
      </div>

      {children && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
