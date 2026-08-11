import type { Metadata } from "next";
import { Catalogo } from "@/components/catalogo";

export const metadata: Metadata = { title: "Início" };

export default function Inicio() {
  return <Catalogo />;
}
