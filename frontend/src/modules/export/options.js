// options.js
// Os formatos de arquivo que a tela de exportação oferece (um cartão para cada um).
import { FileCode, FileSpreadsheet, FileText, Landmark } from "lucide-react";

export const FORMATOS = [
  { id: "csv", titulo: "CSV", Icone: FileCode, texto: "Texto separado por ponto e vírgula. Abre no Excel e em outros sistemas." },
  { id: "xlsx", titulo: "Planilha Excel", Icone: FileSpreadsheet, texto: "Planilha .xlsx com as colunas já ajustadas e prontas para uso." },
  { id: "txt", titulo: "Relatório TXT", Icone: FileText, texto: "Relatório em texto simples, bom para imprimir ou conferir rápido." },
  { id: "ofx", titulo: "Extrato OFX", Icone: Landmark, texto: "Formato bancário. Pode ser importado de novo aqui ou em outros sistemas." },
];
