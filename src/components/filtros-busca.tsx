"use client";

import { useRouter } from "next/navigation";
import type { Categoria, Subcategoria } from "@/types/api";

/**
 * Filtros de categoria e subcategoria. Serve tanto à busca quanto às páginas
 * de tipo — muda apenas o `base` e os parâmetros preservados.
 *
 * As subcategorias são encadeadas: escolher uma categoria restringe a lista, e
 * trocar de categoria descarta a subcategoria que deixou de fazer sentido.
 */
export function FiltrosBusca({
  categorias,
  subcategorias,
  termo,
  tipo,
  categoriaAtual,
  subcategoriaAtual,
  base = "/buscar",
  preservarTipo = true,
}: {
  categorias: Categoria[];
  subcategorias: Subcategoria[];
  /** Só a busca tem termo; nas páginas de tipo ele não existe. */
  termo?: string;
  tipo?: string;
  categoriaAtual?: number;
  subcategoriaAtual?: number;
  base?: string;
  /** Em /tipo/[tipo] o tipo já está na URL e não vira query string. */
  preservarTipo?: boolean;
}) {
  const router = useRouter();

  const disponiveis = categoriaAtual
    ? subcategorias.filter((s) => s.categoriaId === categoriaAtual)
    : subcategorias;

  function navegar(mudanca: Record<string, string | undefined>) {
    const busca = new URLSearchParams();
    const atual: Record<string, string | undefined> = {
      q: termo,
      tipo: preservarTipo ? tipo : undefined,
      categoriaId: categoriaAtual ? String(categoriaAtual) : undefined,
      subcategoriaId: subcategoriaAtual ? String(subcategoriaAtual) : undefined,
      ...mudanca,
    };

    for (const [chave, valor] of Object.entries(atual)) {
      if (valor) busca.set(chave, valor);
    }

    const consulta = busca.toString();
    router.push(consulta ? `${base}?${consulta}` : base);
  }

  const estilo =
    "bg-superficie border-borda text-texto focus:border-acento min-h-11 rounded-lg border px-3 text-sm transition-colors outline-none";

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filtro-categoria" className="text-texto-3 text-xs font-medium">
          Categoria
        </label>
        <select
          id="filtro-categoria"
          value={categoriaAtual ?? ""}
          onChange={(evento) =>
            navegar({
              categoriaId: evento.target.value || undefined,
              // A subcategoria anterior pode não pertencer à nova categoria.
              subcategoriaId: undefined,
            })
          }
          className={estilo}
        >
          <option value="">Todas</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="filtro-subcategoria"
          className="text-texto-3 text-xs font-medium"
        >
          Subcategoria
        </label>
        <select
          id="filtro-subcategoria"
          value={subcategoriaAtual ?? ""}
          onChange={(evento) =>
            navegar({ subcategoriaId: evento.target.value || undefined })
          }
          className={estilo}
        >
          <option value="">Todas</option>
          {disponiveis.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.nome}
            </option>
          ))}
        </select>
      </div>

      {(categoriaAtual || subcategoriaAtual) && (
        <button
          type="button"
          onClick={() =>
            navegar({ categoriaId: undefined, subcategoriaId: undefined })
          }
          className="text-texto-3 hover:text-acento min-h-11 text-sm font-medium transition-colors"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
