import Image from "next/image";

/**
 * Logotipo oficial. O arquivo original é branco, para fundo escuro; a variante
 * de tinta escura é a mesma arte com o preenchimento trocado, usada no tema
 * claro. Renderizamos os dois e alternamos por CSS — assim não depende de
 * JavaScript nem pisca na troca de tema.
 */
export function Marca({
  className = "",
  altura = 30,
}: {
  className?: string;
  altura?: number;
}) {
  // Proporção do arquivo original: 1922.4 × 636.94
  const largura = Math.round((altura * 1922.4) / 636.94);

  return (
    <>
      <Image
        src="/logo/de-escura.svg"
        alt="Digital Educa"
        width={largura}
        height={altura}
        priority
        className={`escuro:hidden ${className}`}
      />
      <Image
        src="/logo/de-branca.svg"
        alt=""
        aria-hidden="true"
        width={largura}
        height={altura}
        priority
        className={`hidden escuro:block ${className}`}
      />
    </>
  );
}
