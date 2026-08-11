import { Esqueleto } from "@/components/esqueleto";

export default function CarregandoConteudo() {
  return (
    <div className="flex flex-col gap-10 pb-8 sm:gap-14">
      <div className="relative min-h-[300px] sm:min-h-[380px] lg:min-h-[440px]">
        <Esqueleto className="absolute inset-0 rounded-none" />
        <div className="calha relative flex w-full  flex-col justify-end gap-4 pt-24 pb-10">
          <Esqueleto className="h-6 w-56 rounded-full" />
          <Esqueleto className="h-9 w-full max-w-lg" />
          <Esqueleto className="h-12 w-52 rounded-full" />
        </div>
      </div>

      <div className="calha grid w-full gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Esqueleto className="h-6 w-24" />
            <Esqueleto className="h-4 w-full" />
            <Esqueleto className="h-4 w-full" />
            <Esqueleto className="h-4 w-3/4" />
          </div>
          <div className="flex flex-col gap-3">
            <Esqueleto className="h-6 w-40" />
            {Array.from({ length: 4 }, (_, indice) => (
              <Esqueleto key={indice} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Esqueleto className="h-6 w-28" />
          <Esqueleto className="h-16 w-full rounded-lg" />
          <Esqueleto className="h-44 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
