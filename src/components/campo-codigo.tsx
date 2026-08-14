"use client";

import { useId, useRef, useState } from "react";

/**
 * Campo do código de confirmação, uma casa por dígito.
 *
 * ## Um input só, não quatro
 *
 * A montagem óbvia — um `<input>` por casa — é a que dá problema. Ela exige
 * gerenciar foco na mão (avançar ao digitar, voltar no backspace, tratar as
 * setas), quebra o colar de "1234" em quatro campos, atrapalha o preenchimento
 * automático do código do SMS, e apresenta ao leitor de tela quatro caixas sem
 * nome próprio no lugar de um campo.
 *
 * Aqui existe UM input de verdade, transparente, esticado por cima das casas.
 * As casas são desenho. Com isso o colar, o autopreenchimento, o backspace, a
 * seleção e o teclado do celular são os do navegador — nada disso é reimplementado
 * — e o rótulo descreve um campo só.
 *
 * A única liberdade que tiramos é o cursor no meio do texto: ele volta sempre
 * ao fim. Editar o segundo dígito de quatro casas desenhadas confunde mais do
 * que ajuda, e apagar e redigitar é imediato num código deste tamanho.
 */
export function CampoCodigo({
  id,
  name = "codigo",
  rotulo,
  dica,
  casas = 4,
  autoFocus = false,
}: {
  id?: string;
  name?: string;
  rotulo: string;
  dica?: string;
  /** Quantos dígitos o código tem. */
  casas?: number;
  autoFocus?: boolean;
}) {
  const gerado = useId();
  const idCampo = id ?? gerado;
  const campo = useRef<HTMLInputElement>(null);

  const [valor, setValor] = useState("");
  const [focado, setFocado] = useState(false);

  const digitos = Array.from({ length: casas }, (_, indice) => valor[indice] ?? "");
  /** Casa que receberá o próximo dígito. Fica na última quando o código completa. */
  const ativa = Math.min(valor.length, casas - 1);

  /*
   * Cursor sempre no fim. `setSelectionRange` é mutação de nó do DOM — a via
   * prevista para isto, já que o React não expõe nada declarativo para posição
   * de cursor. A conferência antes de escrever evita mexer no elemento quando
   * ele já está onde deveria.
   */
  function fixarCursor() {
    const elemento = campo.current;
    if (!elemento) return;
    const fim = elemento.value.length;
    if (elemento.selectionStart !== fim || elemento.selectionEnd !== fim) {
      elemento.setSelectionRange(fim, fim);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={idCampo} className="text-texto-2 text-sm font-medium">
        {rotulo}
      </label>

      <div className="relative w-fit">
        {/* Só desenho: quem responde por tudo é o input abaixo. */}
        <div aria-hidden="true" className="flex gap-2 sm:gap-2.5">
          {digitos.map((digito, indice) => {
            const emFoco = focado && indice === ativa;
            return (
              <div
                key={indice}
                className={`ease-suave flex h-14 w-12 items-center justify-center rounded-lg border text-xl font-semibold tabular-nums transition-[border-color,box-shadow,background-color] duration-150 ${
                  emFoco
                    ? "border-acento ring-acento/25 bg-superficie ring-2"
                    : digito
                      ? "border-borda bg-superficie"
                      : "border-borda bg-superficie/60"
                }`}
              >
                {digito ? (
                  <span className="text-texto">{digito}</span>
                ) : emFoco ? (
                  <span className="animate-cursor bg-acento block h-6 w-px" />
                ) : null}
              </div>
            );
          })}
        </div>

        <input
          ref={campo}
          id={idCampo}
          name={name}
          value={valor}
          onChange={(evento) =>
            // Guarda só dígitos: teclado numérico do celular ainda deixa passar
            // vírgula, ponto e sinal, e colar traz o texto do SMS inteiro.
            setValor(evento.target.value.replace(/\D/g, "").slice(0, casas))
          }
          onFocus={() => {
            setFocado(true);
            fixarCursor();
          }}
          onBlur={() => setFocado(false)}
          onSelect={fixarCursor}
          onPointerUp={fixarCursor}
          type="text"
          inputMode="numeric"
          // É o que oferece o código do SMS na sugestão do teclado.
          autoComplete="one-time-code"
          autoFocus={autoFocus}
          required
          maxLength={casas}
          pattern={`\\d{${casas}}`}
          /*
           * Cobre as casas inteiras e desaparece. As três transparências são
           * necessárias: o texto do input ficaria escrito por cima dos dígitos
           * desenhados, o cursor nativo apareceria fora da casa em foco (o
           * nosso é desenhado junto do dígito) e a faixa de seleção pintaria
           * um retângulo azul sobre as casas ao selecionar tudo.
           */
          className="absolute inset-0 h-full w-full cursor-pointer bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent"
        />
      </div>

      {dica && <p className="text-texto-3 text-xs">{dica}</p>}
    </div>
  );
}
