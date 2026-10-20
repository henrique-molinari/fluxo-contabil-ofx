# projeto-ofx

Mini ERP financeiro que lê extratos bancários no formato **OFX**, guarda as movimentações em um banco **PostgreSQL**, classifica cada uma em categorias e mostra tudo em um painel com gráficos. No fim, dá para exportar os dados tratados em CSV, planilha Excel, TXT ou até em um novo OFX.

O projeto nasceu como uma atividade simples de leitura de arquivo e foi crescendo em etapas, até virar uma aplicação completa com backend em Python e frontend em React.

---

## Sumário

- [O que o projeto faz](#o-que-o-projeto-faz)
- [Tecnologias](#tecnologias)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como rodar](#como-rodar)
- [Etapas da atividade](#etapas-da-atividade)
- [Classificação automática](#classificação-automática)
- [API](#api)
- [Exportação](#exportação)
- [Arquivos de exemplo](#arquivos-de-exemplo)
- [Decisões do projeto](#decisões-do-projeto)
- [Autor](#autor)

---

## O que o projeto faz

O frontend é dividido em quatro módulos, que seguem o caminho natural dos dados:

| Módulo | Para que serve |
| --- | --- |
| **Painel de análise** | Totais de entradas, saídas e saldo; gastos por categoria; comparação mês a mês; evolução do saldo. Os gráficos podem trocar de tipo (rosca, barras, linha). |
| **Importação** | Envia um arquivo `.ofx`, mostra uma prévia do que será gravado (já avisando o que é duplicado) e só depois grava no banco. |
| **Tratamento** | Lista as movimentações, permite trocar a categoria de cada uma e rodar a classificação automática. |
| **Exportação** | Baixa os dados em `csv`, `xlsx`, `txt` ou `ofx`. |

## Tecnologias

**Backend**

- Python 3
- Flask + Flask-CORS (API REST)
- ofxparse (leitura do OFX)
- psycopg2 (conexão com o PostgreSQL)
- python-dotenv (variáveis de ambiente)
- openpyxl (geração de planilhas)

**Banco de dados**

- PostgreSQL hospedado no [Neon](https://neon.tech)

**Frontend**

- React 18 + Vite
- Recharts (gráficos)
- lucide-react (ícones)

## Estrutura de pastas

```
projeto-ofx/
├── main.py                 # Etapa 1: lê o OFX e imprime o extrato no terminal
├── importar_postgres.py    # Etapa 2: grava as movimentações no PostgreSQL
├── banco.py                # Conexão, regras de categoria e leitura do OFX (código compartilhado)
├── api.py                  # Backend Flask usado pelo frontend
├── extrato.ofx             # Extrato pequeno usado na atividade
├── exemplos/               # Extratos de exemplo para testar a importação
├── requirements.txt
├── .env.example            # Modelo das variáveis de conexão com o banco
└── frontend/
    ├── index.html
    ├── vite.config.js      # Proxy de /api para o backend
    └── src/
        ├── App.jsx         # Layout e menu lateral
        ├── api.js          # Chamadas ao backend
        ├── tema.js         # Cores dos gráficos
        ├── pages/          # Analise, Importacao, Tratamento, Exportacao
        └── components/     # Graficos, SeletorGrafico, Carregando
```

## Como rodar

### Pré-requisitos

- Python 3.10 ou superior
- Node.js 18 ou superior
- Um banco PostgreSQL (o projeto usa o plano gratuito do Neon)

### 1. Clonar o repositório

```bash
git clone https://github.com/henrique-molinari/projeto-ofx.git
cd projeto-ofx
```

### 2. Configurar o banco

Copie o modelo e preencha com os dados da sua conexão:

```bash
cp .env.example .env
```

```env
PGHOST=seu-host.neon.tech
PGPORT=5432
PGDATABASE=neondb
PGUSER=neondb_owner
PGPASSWORD=sua_senha
PGSSLMODE=require
```

O arquivo `.env` está no `.gitignore`, então a senha nunca vai para o repositório. A tabela, a coluna de categoria e o índice único são criados automaticamente na primeira conexão.

### 3. Backend

```bash
python -m venv venv

# Windows
venv\Scripts\activate
# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
python api.py
```

A API sobe em `http://localhost:5000`. Para conferir, abra `http://localhost:5000/api/resumo`: deve aparecer um JSON com os totais. Se der erro de conexão, revise o `.env`.

### 4. Frontend

Em um segundo terminal:

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`. O Vite redireciona tudo que começa com `/api` para o backend, então não é preciso configurar CORS nem URLs.

### Rodando só os scripts da atividade

```bash
python main.py                # mostra o extrato no terminal
python importar_postgres.py   # grava o extrato.ofx no PostgreSQL
```

## Etapas da atividade

1. **Leitura do OFX** (`main.py`): abre o `extrato.ofx` com o ofxparse e mostra data, valor e descrição de cada transação, além do total de entradas, saídas e do saldo.
2. **Gravação no PostgreSQL** (`importar_postgres.py`): salva cada movimentação na tabela `movimentacoes`, sem repetir transações.
3. **Classificação**: cada movimentação recebe uma categoria a partir de regras sobre a descrição, e o usuário pode corrigir manualmente.
4. **Interface web**: backend Flask e frontend React com painel, importação, tratamento e exportação.

### Tabela `movimentacoes`

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `id` | `SERIAL` | Chave primária |
| `data_movimentacao` | `DATE` | |
| `valor` | `NUMERIC(15,2)` | Positivo = entrada, negativo = saída |
| `descricao` | `VARCHAR(255)` | |
| `categoria` | `VARCHAR(50)` | Padrão: `Sem categoria` |

Um **índice único** em `(data_movimentacao, valor, descricao)` impede que a mesma transação seja gravada duas vezes. Se você importar o mesmo arquivo de novo, as repetidas são ignoradas e o sistema informa quantas foram inseridas e quantas eram duplicadas.

## Classificação automática

A descrição é convertida para maiúsculas e sem acentos, e depois comparada com palavras-chave:

| Categoria | Palavras-chave |
| --- | --- |
| Receitas | `RECEBIMENTO`, `PAGAMENTO CLIENTE`, `PIX CLIENTE` |
| Aluguel | `ALUGUEL` |
| Energia | `ENERGIA` |
| Internet | `INTERNET` |
| Folha de pagamento | `FOLHA` |
| Material de escritório | `MATERIAL` |
| Equipamentos | `EQUIPAMENTOS` |
| Veículo | `VEICULO`, `ESTACIONAMENTO` |
| Assinaturas | `ASSINATURA` |

O que não casar com nenhuma regra fica como **Sem categoria** e pode ser ajustado à mão no módulo de Tratamento. As categorias `Outros` e `Sem categoria` também podem ser escolhidas manualmente. Para criar uma regra nova, basta editar o dicionário `REGRAS` em [banco.py](banco.py).

## API

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/categorias` | Lista de categorias disponíveis |
| `POST` | `/api/preview` | Lê o OFX enviado e devolve o que seria importado, sem gravar |
| `POST` | `/api/importar` | Importa o OFX e devolve `{inseridas, duplicadas}` |
| `GET` | `/api/movimentacoes` | Todas as movimentações, da mais recente para a mais antiga |
| `PUT` | `/api/movimentacoes/<id>` | Altera a categoria de uma movimentação |
| `POST` | `/api/classificar-automatico` | Aplica as regras em tudo que está sem categoria |
| `DELETE` | `/api/movimentacoes` | Limpa a tabela (útil para refazer testes) |
| `GET` | `/api/resumo` | Totais, gastos por categoria, resumo mensal e evolução do saldo |
| `GET` | `/api/exportar/<formato>` | Baixa em `csv`, `xlsx`, `txt` ou `ofx` |

## Exportação

- **CSV**: separado por ponto e vírgula, valores com vírgula decimal e codificação UTF-8 com BOM, para abrir corretamente no Excel em português.
- **XLSX**: planilha com cabeçalho e largura de colunas ajustada.
- **TXT**: extrato em texto simples, alinhado em colunas.
- **OFX**: arquivo no mesmo layout do extrato original, com caracteres especiais escapados, que pode ser importado de volta no sistema.

## Arquivos de exemplo

A pasta [exemplos/](exemplos) tem dois extratos para testar a importação:

- `extrato_simples.ofx`: 15 transações, o mesmo usado no `main.py`.
- `extrato_completo.ofx`: 149 transações entre janeiro e setembro de 2026, ideal para ver os gráficos do painel com bastante dado.

## Decisões do projeto

- **Código compartilhado em `banco.py`**: a leitura do OFX, a conexão e as regras de categoria ficam em um só lugar, usadas tanto pelo script de importação quanto pela API.
- **Prévia antes de gravar**: a importação mostra o que vai entrar e o que já existe, evitando surpresas.
- **Duplicidade resolvida no banco**: o índice único com `ON CONFLICT DO NOTHING` é mais seguro do que conferir no código.
- **Erro de conexão legível**: no Windows em português, o psycopg2 pode falhar ao decodificar a mensagem do servidor; o `conectar()` trata isso e mostra o erro real.
- **Segredos fora do Git**: credenciais ficam no `.env`, e o repositório só traz o `.env.example`.

## Autor

**Henrique Molinari**

GitHub: [@henrique-molinari](https://github.com/henrique-molinari)
