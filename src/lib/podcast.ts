/**
 * Separa "Convidado — Tema" nas duas partes.
 *
 * Os 18 podcasts do acervo seguem esse padrão de título (por exemplo,
 * "Alfredo Soares — Construindo Máquinas de Vendas"), e é o convidado que puxa
 * o clique. Sem a separação ele fica diluído numa linha só.
 *
 * O separador aparece cadastrado em três formas — travessão, hífen e traço
 * médio —, então todas são aceitas. Título fora do padrão volta inteiro como
 * `convidado`, sem tema: é melhor exibir o título original do que arriscar um
 * corte errado.
 */
export function separarTitulo(titulo: string): {
  convidado: string;
  tema: string | null;
} {
  const encontrado = titulo.match(/^(.{2,60}?)\s*[—–-]\s+(.*)$/);

  if (!encontrado) return { convidado: titulo.trim(), tema: null };

  const [, convidado, tema] = encontrado;
  return { convidado: convidado.trim(), tema: tema.trim() || null };
}
