import type { ReactNode } from "react";

/**
 * Ícone de cada categoria. O casamento é por palavra-chave no nome, e não por
 * id: as categorias são cadastradas pelo painel e os ids podem mudar entre
 * ambientes. Nome desconhecido cai no ícone genérico.
 *
 * Todos os traçados usam viewBox 0 0 20 20 e são desenhados com `stroke`,
 * acompanhando o resto da interface.
 *
 * As chaves precisam ser específicas: o casamento é por substring, então algo
 * curto como "ia" acertaria "categoria" e daria ícone errado a qualquer nome.
 */
const ICONES: { chaves: string[]; icone: ReactNode }[] = [
  {
    // Captação de recursos — moeda caindo em mãos abertas.
    chaves: ["captacao", "recursos", "fundraising", "doacao"],
    icone: (
      <>
        <circle cx="10" cy="5.5" r="2.5" />
        <path d="M4 12c0 3.1 2.7 5.5 6 5.5s6-2.4 6-5.5" />
      </>
    ),
  },
  {
    // Empreendedorismo — foguete.
    chaves: ["empreendedorismo", "empreender", "startup"],
    icone: (
      <>
        <path d="M10 2.5c2.4 1.9 3.8 4.7 3.8 7.7L11.6 12.4H8.4L6.2 10.2c0-3 1.4-5.8 3.8-7.7Z" />
        <circle cx="10" cy="8" r="1.4" />
        <path d="M8.4 12.9 6.6 16l2.4-.9M11.6 12.9 13.4 16 11 15.1" />
      </>
    ),
  },
  {
    // Gestão financeira — cédula. Vem antes de "Gestão" para vencer o match.
    chaves: ["financeira", "financas", "financeiro"],
    icone: (
      <>
        <rect x="2.5" y="5.5" width="15" height="9" rx="1.5" />
        <circle cx="10" cy="10" r="2" />
        <path d="M5.5 8.5v3M14.5 8.5v3" />
      </>
    ),
  },
  {
    // Gestão — organograma.
    chaves: ["gestao", "lideranca", "pessoas", "equipe"],
    icone: (
      <>
        <rect x="7.5" y="2.5" width="5" height="4" rx="1" />
        <rect x="2.5" y="13.5" width="5" height="4" rx="1" />
        <rect x="12.5" y="13.5" width="5" height="4" rx="1" />
        <path d="M10 6.5v3M5 13.5v-2h10v2" />
      </>
    ),
  },
  {
    // Inovação — lâmpada.
    chaves: ["inovacao", "tecnologia", "inteligencia", "digital", "criativ"],
    icone: (
      <>
        <path d="M7.6 12.4a4.8 4.8 0 1 1 4.8 0V14h-4.8v-1.6Z" />
        <path d="M8.4 16.5h3.2" />
      </>
    ),
  },
  {
    // Marketing — megafone.
    chaves: ["marketing", "comunicacao", "midia", "posicionamento"],
    icone: (
      <>
        <path d="M5 8v4l8 3.5V4.5L5 8Z" />
        <path d="M5 8H3.5A1.5 1.5 0 0 0 2 9.5v1A1.5 1.5 0 0 0 3.5 12H5" />
        <path d="M16 8.6a2.6 2.6 0 0 1 0 2.8" />
      </>
    ),
  },
  {
    // Vendas — curva ascendente.
    chaves: ["vendas", "comercial", "receita"],
    icone: (
      <>
        <path d="M3 14.5 7.5 10l3 3L17 6" />
        <path d="M12.8 6H17v4.2" />
      </>
    ),
  },
];

/** Quatro blocos — usado quando o nome não casa com nenhuma palavra-chave. */
const GENERICO: ReactNode = (
  <>
    <rect x="3" y="3" width="6" height="6" rx="1.5" />
    <rect x="11" y="3" width="6" height="6" rx="1.5" />
    <rect x="3" y="11" width="6" height="6" rx="1.5" />
    <rect x="11" y="11" width="6" height="6" rx="1.5" />
  </>
);

/** Remove acentos e caixa para o casamento não depender de grafia. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function iconeDaCategoria(nome: string): ReactNode {
  const limpo = normalizar(nome);
  const achado = ICONES.find((entrada) =>
    entrada.chaves.some((chave) => limpo.includes(chave)),
  );
  return achado?.icone ?? GENERICO;
}
