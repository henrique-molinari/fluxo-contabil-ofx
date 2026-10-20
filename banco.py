# banco.py
# Aqui eu juntei tudo que mexe com o banco de dados e com o arquivo OFX,
# assim o importar_postgres.py e a api.py usam as mesmas funções
# e eu não preciso copiar código.

import os
import unicodedata

import psycopg2
from dotenv import load_dotenv
from ofxparse import OfxParser

# Lê o arquivo .env (onde ficam host, usuário e senha do Neon)
load_dotenv()

# Dados da conexão. Se não achar no .env, usa o valor padrão
CONFIG = {
    "host": os.getenv("PGHOST", "localhost"),
    "port": os.getenv("PGPORT", "5432"),
    "dbname": os.getenv("PGDATABASE", "postgres"),
    "user": os.getenv("PGUSER", "postgres"),
    "password": os.getenv("PGPASSWORD", ""),
    "sslmode": os.getenv("PGSSLMODE", "prefer"),  # o Neon exige "require"
}

# Lista de categorias que o usuário pode escolher para classificar
CATEGORIAS = [
    "Receitas",
    "Aluguel",
    "Energia",
    "Internet",
    "Folha de pagamento",
    "Material de escritório",
    "Equipamentos",
    "Veículo",
    "Assinaturas",
    "Outros",
    "Sem categoria",
]

# Regras da classificação automática: se a descrição tiver a palavra,
# a movimentação vai para aquela categoria (sempre em maiúsculo e sem acento)
REGRAS = {
    "Receitas": ["RECEBIMENTO", "PAGAMENTO CLIENTE", "PIX CLIENTE"],
    "Aluguel": ["ALUGUEL"],
    "Energia": ["ENERGIA"],
    "Internet": ["INTERNET"],
    "Folha de pagamento": ["FOLHA"],
    "Material de escritório": ["MATERIAL"],
    "Equipamentos": ["EQUIPAMENTOS"],
    "Veículo": ["VEICULO", "ESTACIONAMENTO"],
    "Assinaturas": ["ASSINATURA"],
}

# Comandos SQL
SQL_TABELA = """
CREATE TABLE IF NOT EXISTS movimentacoes (
    id SERIAL PRIMARY KEY,
    data_movimentacao DATE,
    valor NUMERIC(15,2),
    descricao VARCHAR(255)
);
"""

# Coluna nova para guardar a classificação (a tabela original não tinha)
SQL_COLUNA_CATEGORIA = """
ALTER TABLE movimentacoes
ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT 'Sem categoria';
"""

# Esse índice único é o bônus: não deixa gravar duas transações iguais
SQL_UNICO = """
CREATE UNIQUE INDEX IF NOT EXISTS ux_movimentacoes
ON movimentacoes (data_movimentacao, valor, descricao);
"""

SQL_INSERT = """
INSERT INTO movimentacoes (data_movimentacao, valor, descricao, categoria)
VALUES (%s, %s, %s, %s)
ON CONFLICT DO NOTHING;
"""


def conectar():
    """Abre a conexão com o PostgreSQL e já garante que a tabela existe."""
    try:
        conexao = psycopg2.connect(**CONFIG)
    except UnicodeDecodeError as erro:
        # No Windows em português o erro vem com acento e o psycopg2 se
        # atrapalha. Aqui eu decodifico do jeito certo pra ver a mensagem real.
        mensagem = bytes(erro.object).decode("cp1252", errors="replace")
        raise ConnectionError(f"Falha ao conectar no PostgreSQL: {mensagem}")
    except psycopg2.OperationalError as erro:
        raise ConnectionError(f"Falha ao conectar no PostgreSQL: {erro}")

    # Cria a tabela, a coluna e o índice se ainda não existirem
    with conexao, conexao.cursor() as cur:
        cur.execute(SQL_TABELA)
        cur.execute(SQL_COLUNA_CATEGORIA)
        cur.execute(SQL_UNICO)
    return conexao


def tirar_acentos(texto):
    """Deixa o texto em maiúsculo e sem acento pra facilitar a comparação."""
    normalizado = unicodedata.normalize("NFD", texto or "")
    sem_acento = "".join(c for c in normalizado if unicodedata.category(c) != "Mn")
    return sem_acento.upper()


def classificar(descricao):
    """Descobre a categoria pela descrição usando o dicionário REGRAS."""
    texto = tirar_acentos(descricao)
    for categoria, palavras in REGRAS.items():
        for palavra in palavras:
            if palavra in texto:
                return categoria
    return "Sem categoria"


def ler_ofx(arquivo):
    """Lê um arquivo OFX (aberto em modo binário) e devolve uma lista de dicionários."""
    ofx = OfxParser.parse(arquivo)
    movimentos = []
    for t in ofx.account.statement.transactions:
        descricao = (t.memo or t.payee or "").strip()[:255]
        movimentos.append(
            {
                "data": t.date.date(),
                "valor": t.amount,
                "descricao": descricao,
                "categoria": classificar(descricao),
            }
        )
    return movimentos


def inserir_movimentos(conexao, movimentos):
    """Insere cada movimento no banco. Devolve (inseridas, duplicadas)."""
    inseridas = 0
    duplicadas = 0
    with conexao, conexao.cursor() as cur:
        for m in movimentos:
            cur.execute(
                SQL_INSERT,
                (m["data"], m["valor"], m["descricao"], m["categoria"]),
            )
            # rowcount = 1 se inseriu, 0 se já existia (duplicada)
            if cur.rowcount:
                inseridas += 1
            else:
                duplicadas += 1
    return inseridas, duplicadas
