import { Esqueleto } from "@/components/esqueleto";

export default function CarregandoTrilha() {
  return (
    <div className="calha flex w-full flex-col gap-10 py-8 sm:py-10">
      <Esqueleto className="h-4 w-24" />

      {/* cabeçalho: capa à esquerda, ficha e progresso à direita */}
      <div className="border-borda-suave flex flex-col gap-6 rounded-2xl border p-5 sm:p-6 lg:flex-row lg:gap-8">
        <Esqueleto className="aspect-video w-full rounded-xl lg:w-72" />
        <div className="flex flex-1 flex-col gap-4">
          <Esqueleto className="h-6 w-32 rounded-full" />
          <Esqueleto className="h-9 w-full max-w-md" />
          <Esqueleto className="h-4 w-full max-w-lg" />
          <Esqueleto className="h-2 w-full rounded-full" />
          <Esqueleto className="h-12 w-52 rounded-full" />
        </div>
      </div>

      {/* jornada */}
      <div className="flex flex-col gap-5">
        <Esqueleto className="h-6 w-40" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, indice) => (
            <div key={indice} className="flex gap-4">
              <Esqueleto className="h-8 w-8 shrink-0 rounded-full" />
              <Esqueleto className="h-24 flex-1 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
