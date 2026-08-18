import { Esqueleto } from "@/components/esqueleto";

export default function CarregandoTrilhas() {
  return (
    <div className="calha flex w-full flex-col gap-6 py-8 sm:gap-8 sm:py-10">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="flex flex-col gap-2">
          <Esqueleto className="h-8 w-40" />
          <Esqueleto className="h-4 w-80 max-w-full" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, indice) => (
            <Esqueleto key={indice} className="h-16 w-full rounded-xl sm:w-28" />
          ))}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, indice) => (
          <Esqueleto key={indice} className="h-56 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
