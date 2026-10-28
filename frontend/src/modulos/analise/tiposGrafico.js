// tiposGrafico.js
// Tipos de gráfico disponíveis em cada painel (alimentam o SeletorGrafico).
import { ChartArea, ChartBar, ChartColumn, ChartLine, ChartPie, Donut } from "lucide-react";

export const TIPOS_CATEGORIA = [
  { id: "rosca", nome: "Rosca", Icone: Donut },
  { id: "pizza", nome: "Pizza", Icone: ChartPie },
  { id: "barras", nome: "Colunas", Icone: ChartColumn },
  { id: "horizontal", nome: "Barras", Icone: ChartBar },
];

export const TIPOS_MENSAL = [
  { id: "barras", nome: "Colunas", Icone: ChartColumn },
  { id: "linha", nome: "Linha", Icone: ChartLine },
  { id: "area", nome: "Área", Icone: ChartArea },
];

export const TIPOS_SALDO = [
  { id: "area", nome: "Área", Icone: ChartArea },
  { id: "linha", nome: "Linha", Icone: ChartLine },
];
