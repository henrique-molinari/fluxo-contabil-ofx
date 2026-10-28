// Geradores de arquivo: cada função recebe as movimentações e devolve { buffer, tipo }.
import ExcelJS from "exceljs";

// Todos os formatos usam as mesmas colunas
const CABECALHO = ["ID", "Data", "Valor", "Descrição", "Categoria"];

// "2026-10-17" -> "17/10/2026"
const dataBR = (iso) => iso.split("-").reverse().join("/");
const dinheiro2 = (n) => n.toFixed(2);

// Texto que começa com = + - @ vira fórmula ao abrir no Excel (CSV injection); o apóstrofo evita isso
const seguro = (t) => (/^[=+\-@\t\r]/.test(t) ? `'${t}` : t);

export function gerarCsv(movs) {
  // Ponto e vírgula e vírgula decimal: é como o Excel brasileiro abre sem reclamar
  const celula = (v) => (/[;"\r\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const linhas = [CABECALHO, ...movs.map((m) => [
    m.id, dataBR(m.data_movimentacao), dinheiro2(m.valor).replace(".", ","), seguro(m.descricao), m.categoria,
  ])];
  const texto = linhas.map((l) => l.map(celula).join(";")).join("\r\n");
  // BOM no começo para o Excel reconhecer os acentos (UTF-8)
  return { buffer: Buffer.from("﻿" + texto, "utf8"), tipo: "text/csv; charset=utf-8" };
}

// Excel de verdade (.xlsx) com cabeçalho em negrito e valores negativos em vermelho
export async function gerarXlsx(movs) {
  const planilha = new ExcelJS.Workbook();
  const aba = planilha.addWorksheet("Movimentações");
  aba.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Data", key: "data", width: 12 },
    { header: "Valor", key: "valor", width: 14, style: { numFmt: '#,##0.00;[Red]-#,##0.00' } },
    { header: "Descrição", key: "descricao", width: 40 },
    { header: "Categoria", key: "categoria", width: 24 },
  ];
  aba.getRow(1).font = { bold: true };
  for (const m of movs) {
    aba.addRow({
      id: m.id, data: dataBR(m.data_movimentacao), valor: m.valor,
      descricao: seguro(m.descricao), categoria: m.categoria,
    });
  }
  const buffer = Buffer.from(await planilha.xlsx.writeBuffer());
  return { buffer, tipo: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
}

// Texto simples em colunas alinhadas, bom para imprimir ou colar em e-mail
export function gerarTxt(movs) {
  const linha = "=".repeat(70);
  const corpo = movs.map(
    (m) => `${dataBR(m.data_movimentacao)} | R$ ${dinheiro2(m.valor).padStart(10)} | ${m.categoria.padEnd(22)} | ${m.descricao}`
  );
  const texto = ["EXTRATO DE MOVIMENTAÇÕES", linha, ...corpo, linha, `Total de movimentações: ${movs.length}`].join("\n");
  return { buffer: Buffer.from(texto, "utf8"), tipo: "text/plain; charset=utf-8" };
}

// Gera um OFX 1.02 (SGML) que outros sistemas contábeis conseguem importar
export function gerarOfx(movs) {
  const agora = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const datas = movs.map((m) => m.data_movimentacao).sort();
  const dt = (iso) => iso.replace(/-/g, "") + "120000";
  const saldo = movs.reduce((s, m) => s + m.valor, 0);
  // No OFX os caracteres & e < precisam ser escapados
  const escapar = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");

  const linhas = [
    "OFXHEADER:100", "DATA:OFXSGML", "VERSION:102", "SECURITY:NONE", "ENCODING:UTF-8",
    "CHARSET:NONE", "COMPRESSION:NONE", "OLDFILEUID:NONE", "NEWFILEUID:NONE", "",
    "<OFX>",
    "<SIGNONMSGSRSV1><SONRS>", "<STATUS><CODE>0<SEVERITY>INFO</STATUS>", `<DTSERVER>${agora}`, "<LANGUAGE>POR",
    "</SONRS></SIGNONMSGSRSV1>",
    "<BANKMSGSRSV1><STMTTRNRS>", "<TRNUID>1", "<STATUS><CODE>0<SEVERITY>INFO</STATUS>",
    "<STMTRS>", "<CURDEF>BRL",
    "<BANKACCTFROM>", "<BANKID>0001", "<ACCTID>00000-0", "<ACCTTYPE>CHECKING", "</BANKACCTFROM>",
    "<BANKTRANLIST>", `<DTSTART>${dt(datas[0])}`, `<DTEND>${dt(datas.at(-1))}`,
  ];
  for (const m of movs) {
    const texto = escapar(m.descricao);
    linhas.push(
      "<STMTTRN>",
      `<TRNTYPE>${m.valor > 0 ? "CREDIT" : "DEBIT"}`,
      `<DTPOSTED>${dt(m.data_movimentacao)}`,
      `<TRNAMT>${dinheiro2(m.valor)}`,
      `<FITID>${m.id}`,
      `<NAME>${texto.slice(0, 32)}`,
      `<MEMO>${texto}`,
      "</STMTTRN>"
    );
  }
  linhas.push(
    "</BANKTRANLIST>", `<LEDGERBAL><BALAMT>${dinheiro2(saldo)}<DTASOF>${agora}</LEDGERBAL>`,
    "</STMTRS>", "</STMTTRNRS></BANKMSGSRSV1>", "</OFX>"
  );
  return { buffer: Buffer.from(linhas.join("\n"), "utf8"), tipo: "application/x-ofx" };
}

// Mapa usado pela rota: o formato da URL escolhe a função geradora
export const FORMATOS = { csv: gerarCsv, xlsx: gerarXlsx, txt: gerarTxt, ofx: gerarOfx };
