# main.py
# Primeira parte da atividade: ler o extrato.ofx e mostrar no terminal.

from ofxparse import OfxParser

ARQUIVO = "extrato.ofx"

# Abro o arquivo em modo binário e passo pro ofxparse ler
with open(ARQUIVO, "rb") as arquivo:
    ofx = OfxParser.parse(arquivo)

# Guardo a lista de transações numa variável pra usar mais de uma vez
transacoes = ofx.account.statement.transactions

print("EXTRATO BANCÁRIO")
print("=" * 38)

# Começo os totais zerados
entradas = 0
saidas = 0

# Passo por cada transação mostrando data, valor e descrição
for t in transacoes:
    print(f"""
Data      : {t.date.strftime('%d/%m/%Y')}
Valor     : R$ {t.amount:.2f}
Descrição : {t.memo}
--------------------------------------""")

    # Valor positivo é entrada, negativo é saída
    if t.amount > 0:
        entradas += t.amount
    else:
        saidas += t.amount

# Como as saídas já são negativas, o saldo é só somar
saldo = entradas + saidas

print(f"\nTotal de movimentações: {len(transacoes)}")
print(f"Entradas: R$ {entradas:.2f}")
print(f"Saídas  : R$ {saidas:.2f}")
print(f"Saldo   : R$ {saldo:.2f}")
