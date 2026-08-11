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
  return <div className="animate-subir">{children}</div>;
}
