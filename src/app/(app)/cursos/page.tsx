import type { Metadata } from "next";
import { ListagemConteudos } from "@/components/listagem-conteudos";
import { DESCRICOES_DE_TIPO, ROTULOS_PLURAIS } from "@/lib/nav";

export const metadata: Metadata = { title: ROTULOS_PLURAIS.CURSO };

/** Acervo de cursos — tipo `CURSO` no contrato da API. */
export default async function PaginaCursos({
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
      tipo="CURSO"
      titulo={ROTULOS_PLURAIS.CURSO}
      descricao={DESCRICOES_DE_TIPO.CURSO}
      base="/cursos"
      {...filtros}
    />
  );
}
