import { Esqueleto, EsqueletoGrade } from "@/components/esqueleto";

export default function CarregandoBusca() {
  return (
    <div className="calha flex w-full flex-col gap-8 py-8 sm:py-10">
      <div className="flex flex-col gap-4">
        <Esqueleto className="h-8 w-64" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }, (_, indice) => (
            <Esqueleto key={indice} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      </div>
      <EsqueletoGrade quantidade={12} colunas="grid-cols-2 md:grid-cols-3 lg:grid-cols-4" />
    </div>
  );
}
