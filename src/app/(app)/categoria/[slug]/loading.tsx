import { Esqueleto, EsqueletoTrilho } from "@/components/esqueleto";

export default function CarregandoCategoria() {
  return (
    <div className="flex flex-col gap-10 pb-8 sm:gap-12">
      <header className="calha flex w-full flex-col gap-2 pt-8 sm:pt-10">
        <Esqueleto className="h-3 w-24" />
        <Esqueleto className="h-8 w-64 max-w-full" />
        <Esqueleto className="h-4 w-48" />
      </header>

      <EsqueletoTrilho />
      <EsqueletoTrilho />
    </div>
  );
}
