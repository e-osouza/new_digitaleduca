/**
 * `template` (e não `layout`) para que o React remonte a cada navegação — é o
 * que faz a animação de entrada rodar de novo ao trocar de página.
 * A animação respeita `prefers-reduced-motion` pelo reset em globals.css.
 */
export default function TemplateApp({
  children,
}: {
  children: React.ReactNode;
}) {
  /*
   * `flex-1` repassa a altura da área de conteúdo para a página. Sem isso
   * nada lá dentro consegue se centrar na vertical: a cadeia toda é dirigida
   * pelo conteúdo, então `h-full` não resolve em ninguém. Páginas que não
   * pedem `flex-1` continuam com a altura do próprio conteúdo.
   */
  return <div className="animate-subir flex flex-1 flex-col">{children}</div>;
}
