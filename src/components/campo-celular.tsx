"use client";

import { useState } from "react";
import { Campo } from "@/components/campo";

/** Só os dígitos, no máximo os 11 de um celular com DDD. */
function apenasDigitos(valor: string) {
  const digitos = valor.replace(/\D/g, "");
  /*
   * Número colado da agenda ou do WhatsApp costuma vir com o +55 na frente.
   * Sem descartar o DDI, ele ocuparia o lugar do DDD e a máscara embaralharia
   * o número inteiro — "+55 (11) 91234-5678" viraria "(55) 11912-3456".
   */
  const semDdi =
    digitos.length > 11 && digitos.startsWith("55") ? digitos.slice(2) : digitos;
  return semDdi.slice(0, 11);
}

/**
 * Escreve o número na máscara brasileira, aceitando o que já foi digitado.
 *
 * O corte entre prefixo e sufixo depende do tamanho: 11 dígitos é celular
 * (`(11) 91234-5678`), 10 é fixo (`(11) 1234-5678`). Decidir pelo total, e não
 * pelo nono dígito ser 9, evita a máscara pular de lugar no meio da digitação.
 */
export function formatarCelular(valor: string) {
  const digitos = apenasDigitos(valor);
  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;

  const corte = digitos.length > 10 ? 7 : 6;
  const inicio = `(${digitos.slice(0, 2)}) ${digitos.slice(2, corte)}`;
  return digitos.length > corte ? `${inicio}-${digitos.slice(corte)}` : inicio;
}

/**
 * Onde o cursor deve parar depois de `digitos` dígitos do texto mascarado.
 *
 * Sem isso o cursor voltaria para o fim a cada tecla, e corrigir o DDD de um
 * número já preenchido viraria apagar tudo e redigitar. Depois do dígito
 * pulamos os separadores à frente para o cursor encostar no próximo dígito, que
 * é onde a próxima tecla vai escrever de qualquer jeito.
 */
function cursorApos(mascarado: string, digitos: number) {
  let vistos = 0;
  let posicao = 0;

  if (digitos > 0) {
    for (let indice = 0; indice < mascarado.length; indice++) {
      if (/\d/.test(mascarado[indice])) vistos++;
      if (vistos === digitos) {
        posicao = indice + 1;
        break;
      }
    }
  } else {
    // Nenhum dígito à esquerda: logo depois do "(" que a máscara já abriu.
    posicao = mascarado ? 1 : 0;
  }

  while (posicao < mascarado.length && !/\d/.test(mascarado[posicao])) posicao++;
  return posicao;
}

/**
 * Campo de celular com máscara.
 *
 * O `<input>` é mutado na mão dentro do `onChange` — antes de devolver o valor
 * ao React — porque o estado sozinho não daria conta de duas situações: quando
 * a tecla digitada some na formatação (uma letra, por exemplo) o estado não
 * muda, não há re-render e o caractere ficaria visível na caixa; e o cursor
 * precisa ser reposicionado sobre o valor já formatado. Como o valor no DOM e
 * o do estado terminam iguais, o React não reescreve o campo no commit e a
 * posição do cursor sobrevive.
 */
export function CampoCelular({
  id = "celular",
  name = "celular",
  rotulo = "Celular",
  defaultValue = "",
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  id?: string;
  rotulo?: string;
  dica?: string;
}) {
  const [valor, setValor] = useState(() => formatarCelular(String(defaultValue)));

  function aoDigitar(evento: React.ChangeEvent<HTMLInputElement>) {
    const campo = evento.target;
    const bruto = campo.value;
    const ate = campo.selectionStart ?? bruto.length;
    const digitosAEsquerda = apenasDigitos(bruto.slice(0, ate)).length;

    const formatado = formatarCelular(bruto);
    const cursor = cursorApos(formatado, digitosAEsquerda);

    campo.value = formatado;
    campo.setSelectionRange(cursor, cursor);
    setValor(formatado);
  }

  return (
    <Campo
      id={id}
      name={name}
      rotulo={rotulo}
      value={valor}
      onChange={aoDigitar}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      maxLength={15}
      /*
       * Segura o número pela metade antes do envio. O `title` não é enfeite: é
       * o texto que o navegador mostra quando o formato não bate.
       */
      pattern="\(\d{2}\) \d{4,5}-\d{4}"
      title="Informe DDD e número, como (11) 91234-5678."
      placeholder="(11) 91234-5678"
      {...props}
    />
  );
}
