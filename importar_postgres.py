# importar_postgres.py
# Desafio extra da atividade: pegar as movimentações do extrato.ofx
# e gravar no PostgreSQL (Neon), sem gravar transação repetida.
# Agora a parte pesada está no banco.py, aqui eu só chamo as funções.

from banco import conectar, inserir_movimentos, ler_ofx

ARQUIVO = "extrato.ofx"


def main():
    # Abro o arquivo em modo binário ("rb") igual na aula
    with open(ARQUIVO, "rb") as arquivo:
        movimentos = ler_ofx(arquivo)

    try:
        conexao = conectar()
    except ConnectionError as erro:
        raise SystemExit(erro)

    try:
        inseridas, duplicadas = inserir_movimentos(conexao, movimentos)

        # Conto quantos registros ficaram na tabela pra conferir
        with conexao, conexao.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM movimentacoes")
            total = cur.fetchone()[0]
    finally:
        conexao.close()

    print(f"Inseridas: {inseridas} | Duplicadas ignoradas: {duplicadas}")
    print(f"Total de registros na tabela movimentacoes: {total}")


if __name__ == "__main__":
    main()
