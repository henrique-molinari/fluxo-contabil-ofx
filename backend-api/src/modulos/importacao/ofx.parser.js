// Leitor de arquivos OFX (formato SGML dos bancos brasileiros).
// Exemplo de transação:  <STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20261017120000<TRNAMT>-50.00<MEMO>ALUGUEL</STMTTRN>
// Nem todo banco fecha as tags (</TRNAMT>), então lemos "<TAG>valor" até o próximo "<".
import { ErroHttp } from "../../compartilhado/erros.js";
import { classificar } from "../tratamento/classificador.js";

const ENTIDADES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" };

// O cabeçalho diz a codificação: CHARSET:1252 = Windows-1252; senão assumimos UTF-8.
export function decodificar(buffer) {
  const inicio = buffer.subarray(0, 600).toString("latin1");
  const latin = /CHARSET:\s*1252/i.test(inicio) || /ENCODING:\s*USASCII/i.test(inicio);
  const utf8 = /ENCODING:\s*UTF-8/i.test(inicio);
  return new TextDecoder(latin && !utf8 ? "windows-1252" : "utf-8").decode(buffer);
}

// Pega o texto depois de <TAG> até o próximo "<" ou quebra de linha
function campo(bloco, tag) {
  const m = bloco.match(new RegExp(`<${tag}>([^<\\r\\n]*)`, "i"));
  return m ? m[1].trim() : "";
}

// Aceita formato brasileiro (1.234,56) e americano (1234.56)
function lerValor(texto) {
  let t = texto.replace(/\s/g, "");
  // "1.234,56" -> 1234.56  |  "-50,00" -> -50.00  |  "-50.00" continua igual
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

// "20261017120000" -> "2026-10-17". Devolve null se a data não existir (ex.: 31/02)
function lerData(texto) {
  const m = texto.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  const data = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  const valida = data.getUTCMonth() === +m[2] - 1 && data.getUTCDate() === +m[3];
  return valida ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

// Troca entidades (&amp;) pelo caractere real e junta espaços repetidos
const limparTexto = (t) => t.replace(/&(amp|lt|gt|quot|apos);/g, (e) => ENTIDADES[e]).replace(/\s+/g, " ").trim();

// Recebe o arquivo (Buffer) e devolve [{ data, valor, descricao, categoria }]
export function lerOfx(buffer) {
  const texto = decodificar(buffer);
  if (!/<OFX>/i.test(texto)) throw new ErroHttp(422, "O arquivo não parece ser um OFX válido.");

  // Cada <STMTTRN> é uma transação; o bloco termina na tag de fechamento ou no início da próxima
  const blocos = [...texto.matchAll(/<STMTTRN>([\s\S]*?)(?=<\/STMTTRN>|<STMTTRN>|<\/BANKTRANLIST>|$)/gi)];
  if (blocos.length === 0) throw new ErroHttp(422, "Nenhuma transação encontrada no arquivo.");

  return blocos.map(([, bloco], i) => {
    const data = lerData(campo(bloco, "DTPOSTED"));
    const valor = lerValor(campo(bloco, "TRNAMT"));
    if (!data || Number.isNaN(valor)) {
      throw new ErroHttp(422, `Transação ${i + 1} do arquivo está com data ou valor inválido.`);
    }
    const descricao = limparTexto(campo(bloco, "MEMO") || campo(bloco, "NAME")).slice(0, 255);
    return { data, valor, descricao, categoria: classificar(descricao) };
  });
}
