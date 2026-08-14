import { Esqueleto, EsqueletoGrade } from "@/components/esqueleto";

export default function CarregandoMinhaLista() {
  return (
    <div className="calha flex w-full flex-col gap-6 py-8 sm:gap-8 sm:py-10">
      <div className="flex flex-col gap-2">
        <Esqueleto className="h-8 w-48" />
        <Esqueleto className="h-4 w-72 max-w-full" />
      </div>
      <EsqueletoGrade quantidade={10} />
    </div>
  );
}
