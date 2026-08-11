import { Cabecalho } from "@/components/cabecalho";
import { Rodape } from "@/components/rodape";

/** Layout do site público: landing, login e cadastro. */
export default function LayoutSite({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <Cabecalho />
      <main className="flex-1">{children}</main>
      <Rodape />
    </div>
  );
}
