import { Esqueleto, EsqueletoTrilho } from "@/components/esqueleto";

export default function CarregandoInicio() {
  return (
    <div className="flex flex-col gap-10 pb-8 sm:gap-14">
      {/* herói */}
      <div className="relative min-h-[340px] sm:min-h-[420px] lg:min-h-[500px]">
        <Esqueleto className="absolute inset-0 rounded-none" />
        <div className="calha relative flex w-full h-full  flex-col justify-end gap-4 pt-24 pb-10">
          <Esqueleto className="h-6 w-40 rounded-full" />
          <Esqueleto className="h-10 w-full max-w-xl" />
          <Esqueleto className="h-4 w-full max-w-md" />
          <Esqueleto className="h-12 w-44 rounded-full" />
        </div>
      </div>

      <EsqueletoTrilho />
      <EsqueletoTrilho />
      <EsqueletoTrilho />
    </div>
  );
}
