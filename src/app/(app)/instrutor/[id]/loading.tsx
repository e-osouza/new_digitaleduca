import { Esqueleto, EsqueletoGrade } from "@/components/esqueleto";

export default function CarregandoInstrutor() {
  return (
    <div className="calha flex w-full flex-col gap-8 py-8 sm:py-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <Esqueleto className="h-24 w-24 shrink-0 rounded-full sm:h-28 sm:w-28" />
        <div className="flex flex-1 flex-col gap-3">
          <Esqueleto className="h-8 w-64 max-w-full" />
          <Esqueleto className="h-4 w-40" />
          <Esqueleto className="h-4 w-full max-w-xl" />
        </div>
      </header>

      <EsqueletoGrade quantidade={12} />
    </div>
  );
}
