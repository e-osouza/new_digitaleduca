import type { Metadata } from "next";
import { ListagemConteudos } from "@/components/listagem-conteudos";
import { DESCRICOES_DE_TIPO, ROTULOS_PLURAIS } from "@/lib/nav";

export const metadata: Metadata = { title: ROTULOS_PLURAIS.AULA };

/**
 * MasterClass — tipo `AULA` no contrato da API.
 *
 * O valor `AULA` não muda: ele viaja para o app mobile já instalado. Só o
 * rótulo virou "MasterClass", e ele vem de `ROTULOS_PLURAIS`.
 */
export default async function PaginaMasterClass({
  searchParams,
}: {
  searchParams: Promise<{
    pagina?: string;
    categoriaId?: string;
    subcategoriaId?: string;
  }>;
}) {
  const filtros = await searchParams;

  return (
    <ListagemConteudos
      tipo="AULA"
      titulo={ROTULOS_PLURAIS.AULA}
      descricao={DESCRICOES_DE_TIPO.AULA}
      base="/masterclass"
      {...filtros}
    />
  );
}
