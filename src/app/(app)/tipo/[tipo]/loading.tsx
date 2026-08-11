import { Esqueleto, EsqueletoGrade } from "@/components/esqueleto";
import { FAIXA } from "@/lib/ui";

export default function CarregandoTipo() {
  return (
    <div className={`${FAIXA} flex flex-col gap-6 py-8 sm:gap-8 sm:py-10`}>
      <div className="flex flex-col gap-2">
        <Esqueleto className="h-8 w-44" />
        <Esqueleto className="h-4 w-72" />
      </div>
      <EsqueletoGrade
        quantidade={12}
        colunas="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      />
    </div>
  );
}
