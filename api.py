# api.py
# Esse é o backend do meu mini ERP. Ele é uma API feita com Flask:
# o React (front) chama essas rotas pra importar, classificar,
# analisar e exportar as movimentações.
# Pra rodar:  python api.py   (fica em http://localhost:5000)

import csv
import io
from datetime import date, datetime

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from openpyxl import Workbook

from banco import CATEGORIAS, classificar, conectar, inserir_movimentos, ler_ofx

app = Flask(__name__)
CORS(app)  # deixa o front (outra porta) conversar com essa API


# ---------- funções auxiliares ----------

def linhas_para_dicts(cur):
    """Transforma o resultado do SELECT em lista de dicionários (fica mais fácil pro JSON)."""
    colunas = [c[0] for c in cur.description]
    resultado = []
    for linha in cur.fetchall():
        item = dict(zip(colunas, linha))
        # O JSON não entende Decimal nem date, então converto
        item["valor"] = float(item["valor"])
        item["data_movimentacao"] = item["data_movimentacao"].isoformat()
        resultado.append(item)
    return resultado


def buscar_movimentacoes():
    """Pega todas as movimentações do banco, da mais nova pra mais antiga."""
    conexao = conectar()
    try:
        with conexao, conexao.cursor() as cur:
            cur.execute(
                """SELECT id, data_movimentacao, valor, descricao, categoria
                   FROM movimentacoes
                   ORDER BY data_movimentacao DESC, id DESC"""
            )
            return linhas_para_dicts(cur)
    finally:
        conexao.close()


def erro(mensagem, codigo=400):
    return jsonify({"erro": mensagem}), codigo


# ---------- módulo de importação e tratamento ----------

@app.get("/api/categorias")
def listar_categorias():
    # O front usa essa lista pra montar os selects de classificação
    return jsonify(CATEGORIAS)


@app.post("/api/preview")
def preview():
    """Lê o arquivo enviado e mostra o que vai ser importado, SEM gravar nada."""
    arquivo = request.files.get("arquivo")
    if not arquivo:
        return erro("Nenhum arquivo enviado.")

    try:
        movimentos = ler_ofx(arquivo.stream)
    except Exception:
        return erro("Não consegui ler esse arquivo. Ele é um OFX válido?")

    # Vejo quais já existem no banco pra avisar que são duplicadas
    conexao = conectar()
    try:
        with conexao, conexao.cursor() as cur:
            for m in movimentos:
                cur.execute(
                    """SELECT 1 FROM movimentacoes
                       WHERE data_movimentacao = %s AND valor = %s AND descricao = %s""",
                    (m["data"], m["valor"], m["descricao"]),
                )
                m["duplicada"] = cur.fetchone() is not None
    finally:
        conexao.close()

    # Converto pra tipos que o JSON entende
    for m in movimentos:
        m["data"] = m["data"].isoformat()
        m["valor"] = float(m["valor"])
    return jsonify(movimentos)


@app.post("/api/importar")
def importar():
    """Lê o arquivo e grava no PostgreSQL já com a categoria automática."""
    arquivo = request.files.get("arquivo")
    if not arquivo:
        return erro("Nenhum arquivo enviado.")

    try:
        movimentos = ler_ofx(arquivo.stream)
    except Exception:
        return erro("Não consegui ler esse arquivo. Ele é um OFX válido?")

    conexao = conectar()
    try:
        inseridas, duplicadas = inserir_movimentos(conexao, movimentos)
    finally:
        conexao.close()
    return jsonify({"inseridas": inseridas, "duplicadas": duplicadas})


@app.get("/api/movimentacoes")
def listar_movimentacoes():
    return jsonify(buscar_movimentacoes())


@app.put("/api/movimentacoes/<int:id>")
def classificar_manual(id):
    """Muda a categoria de UMA movimentação (o usuário escolhe no select)."""
    categoria = (request.get_json() or {}).get("categoria")
    if categoria not in CATEGORIAS:
        return erro("Categoria inválida.")

    conexao = conectar()
    try:
        with conexao, conexao.cursor() as cur:
            cur.execute(
                "UPDATE movimentacoes SET categoria = %s WHERE id = %s",
                (categoria, id),
            )
            if cur.rowcount == 0:
                return erro("Movimentação não encontrada.", 404)
    finally:
        conexao.close()
    return jsonify({"ok": True})


@app.post("/api/classificar-automatico")
def classificar_automatico():
    """Aplica as regras do banco.py em tudo que ainda está 'Sem categoria'."""
    conexao = conectar()
    atualizadas = 0
    try:
        with conexao, conexao.cursor() as cur:
            cur.execute(
                "SELECT id, descricao FROM movimentacoes WHERE categoria = 'Sem categoria'"
            )
            for id, descricao in cur.fetchall():
                nova = classificar(descricao)
                if nova != "Sem categoria":
                    cur.execute(
                        "UPDATE movimentacoes SET categoria = %s WHERE id = %s",
                        (nova, id),
                    )
                    atualizadas += 1
    finally:
        conexao.close()
    return jsonify({"atualizadas": atualizadas})


@app.delete("/api/movimentacoes")
def apagar_tudo():
    """Limpa a tabela inteira (usei pra refazer os testes)."""
    conexao = conectar()
    try:
        with conexao, conexao.cursor() as cur:
            cur.execute("DELETE FROM movimentacoes")
            apagadas = cur.rowcount
    finally:
        conexao.close()
    return jsonify({"apagadas": apagadas})


# ---------- módulo de análise ----------

@app.get("/api/resumo")
def resumo():
    """Calcula os números do painel: totais, gastos por categoria e por mês."""
    movimentos = buscar_movimentacoes()

    entradas = 0.0
    saidas = 0.0
    por_categoria = {}  # só as saídas (gastos)
    por_mes = {}        # entradas e saídas de cada mês
    por_dia = {}        # movimento líquido de cada dia (pro gráfico de saldo)
    qtd_entradas = 0
    qtd_saidas = 0

    for m in movimentos:
        valor = m["valor"]
        dia = m["data_movimentacao"]
        mes = dia[:7]  # pega só "2026-10"
        por_mes.setdefault(mes, {"mes": mes, "entradas": 0.0, "saidas": 0.0})
        por_dia[dia] = por_dia.get(dia, 0.0) + valor

        if valor > 0:
            entradas += valor
            qtd_entradas += 1
            por_mes[mes]["entradas"] += valor
        else:
            saidas += valor
            qtd_saidas += 1
            por_mes[mes]["saidas"] += abs(valor)
            cat = m["categoria"]
            por_categoria[cat] = por_categoria.get(cat, 0) + abs(valor)

    # Evolução do saldo: vou somando dia após dia (saldo acumulado)
    evolucao = []
    acumulado = 0.0
    for dia in sorted(por_dia):
        acumulado += por_dia[dia]
        evolucao.append({"dia": dia, "saldo": round(acumulado, 2)})

    return jsonify(
        {
            "entradas": round(entradas, 2),
            "saidas": round(saidas, 2),
            "saldo": round(entradas + saidas, 2),
            "quantidade": len(movimentos),
            "qtd_entradas": qtd_entradas,
            "qtd_saidas": qtd_saidas,
            "evolucao": evolucao,
            "por_categoria": sorted(
                [{"categoria": c, "total": round(v, 2)} for c, v in por_categoria.items()],
                key=lambda x: x["total"],
                reverse=True,
            ),
            "por_mes": sorted(por_mes.values(), key=lambda x: x["mes"]),
        }
    )


# ---------- módulo de exportação ----------

@app.get("/api/exportar/<formato>")
def exportar(formato):
    """Gera o arquivo em csv, xlsx (planilha), txt ou ofx e manda pro navegador baixar."""
    movimentos = buscar_movimentacoes()
    cabecalho = ["ID", "Data", "Valor", "Descrição", "Categoria"]
    linhas = [
        [
            m["id"],
            date.fromisoformat(m["data_movimentacao"]).strftime("%d/%m/%Y"),
            m["valor"],
            m["descricao"],
            m["categoria"],
        ]
        for m in movimentos
    ]

    if formato == "csv":
        texto = io.StringIO()
        # Uso ponto e vírgula porque o Excel brasileiro abre melhor assim
        escritor = csv.writer(texto, delimiter=";")
        escritor.writerow(cabecalho)
        for l in linhas:
            escritor.writerow([l[0], l[1], f"{l[2]:.2f}".replace(".", ","), l[3], l[4]])
        # utf-8-sig pra o Excel não bagunçar os acentos
        arquivo = io.BytesIO(texto.getvalue().encode("utf-8-sig"))
        return send_file(
            arquivo, mimetype="text/csv", as_attachment=True,
            download_name="movimentacoes.csv",
        )

    if formato == "xlsx":
        planilha = Workbook()
        aba = planilha.active
        aba.title = "Movimentações"
        aba.append(cabecalho)
        for l in linhas:
            aba.append(l)
        # Deixo as colunas mais largas pra caber o texto
        for coluna, largura in zip("ABCDE", [8, 12, 14, 40, 24]):
            aba.column_dimensions[coluna].width = largura
        arquivo = io.BytesIO()
        planilha.save(arquivo)
        arquivo.seek(0)
        return send_file(
            arquivo,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name="movimentacoes.xlsx",
        )

    if formato == "txt":
        saida = ["EXTRATO DE MOVIMENTAÇÕES", "=" * 70]
        for l in linhas:
            saida.append(f"{l[1]} | R$ {l[2]:>10.2f} | {l[4]:<22} | {l[3]}")
        saida.append("=" * 70)
        saida.append(f"Total de movimentações: {len(linhas)}")
        arquivo = io.BytesIO("\n".join(saida).encode("utf-8"))
        return send_file(
            arquivo, mimetype="text/plain", as_attachment=True,
            download_name="movimentacoes.txt",
        )

    if formato == "ofx":
        # Um OFX sem nenhuma transação não serve pra nada, então aviso o usuário
        if not movimentos:
            return erro("Não há movimentações para exportar.")

        # Monta o texto do arquivo OFX no mesmo formato do extrato.ofx da aula
        agora = datetime.now().strftime("%Y%m%d%H%M%S")
        datas = [m["data_movimentacao"] for m in movimentos]
        inicio = min(datas).replace("-", "") + "120000"
        fim = max(datas).replace("-", "") + "120000"
        saldo = sum(m["valor"] for m in movimentos)

        ofx = [
            "OFXHEADER:100", "DATA:OFXSGML", "VERSION:102", "SECURITY:NONE",
            "ENCODING:UTF-8", "CHARSET:NONE", "COMPRESSION:NONE",
            "OLDFILEUID:NONE", "NEWFILEUID:NONE", "",
            "<OFX>",
            "<SIGNONMSGSRSV1><SONRS>",
            "<STATUS><CODE>0<SEVERITY>INFO</STATUS>",
            f"<DTSERVER>{agora}", "<LANGUAGE>POR",
            "</SONRS></SIGNONMSGSRSV1>",
            "<BANKMSGSRSV1><STMTTRNRS>",
            "<TRNUID>1", "<STATUS><CODE>0<SEVERITY>INFO</STATUS>",
            "<STMTRS>", "<CURDEF>BRL",
            "<BANKACCTFROM>", "<BANKID>0001", "<ACCTID>00000-0",
            "<ACCTTYPE>CHECKING", "</BANKACCTFROM>",
            "<BANKTRANLIST>", f"<DTSTART>{inicio}", f"<DTEND>{fim}",
        ]
        for m in movimentos:
            # No OFX não pode ter & nem < no texto, senão quebra a leitura
            texto = m["descricao"].replace("&", "&amp;").replace("<", "&lt;")
            ofx += [
                "<STMTTRN>",
                "<TRNTYPE>" + ("CREDIT" if m["valor"] > 0 else "DEBIT"),
                "<DTPOSTED>" + m["data_movimentacao"].replace("-", "") + "120000",
                f"<TRNAMT>{m['valor']:.2f}",
                f"<FITID>{m['id']}",
                f"<NAME>{texto[:32]}",
                f"<MEMO>{texto}",
                "</STMTTRN>",
            ]
        ofx += [
            "</BANKTRANLIST>",
            f"<LEDGERBAL><BALAMT>{saldo:.2f}<DTASOF>{agora}</LEDGERBAL>",
            "</STMTRS>", "</STMTTRNRS></BANKMSGSRSV1>", "</OFX>",
        ]
        arquivo = io.BytesIO("\n".join(ofx).encode("utf-8"))
        return send_file(
            arquivo, mimetype="application/x-ofx", as_attachment=True,
            download_name="movimentacoes.ofx",
        )

    return erro("Formato inválido. Use csv, xlsx, txt ou ofx.", 404)


# Se der erro de conexão com o banco, devolvo uma mensagem em vez de quebrar
@app.errorhandler(ConnectionError)
def erro_de_conexao(e):
    return erro(str(e), 500)


if __name__ == "__main__":
    app.run(port=5000, debug=True)
