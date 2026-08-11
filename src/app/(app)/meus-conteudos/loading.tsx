import { Esqueleto, EsqueletoGrade } from "@/components/esqueleto";

export default function CarregandoMeusConteudos() {
  return (
    <div className="calha flex w-full flex-col gap-8 py-8 sm:py-10">
      <div className="flex flex-col gap-2">
        <Esqueleto className="h-8 w-72" />
        <Esqueleto className="h-4 w-56" />
      </div>
      <EsqueletoGrade />
    </div>
  );
}
