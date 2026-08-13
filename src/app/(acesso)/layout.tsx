/**
 * Layout das telas de acesso: entrar, criar conta e recuperar senha.
 *
 * Grupo próprio justamente para NÃO herdar o cabeçalho e o rodapé de `(site)`.
 * Aqui a tela inteira pertence ao formulário: quem chega tem uma tarefa só, e
 * a moldura do site oferecia navegação que não leva a lugar nenhum antes do
 * login. O caminho de volta ao institucional continua existindo, no logotipo
 * do painel.
 */
export default function LayoutAcesso({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh">{children}</div>;
}
