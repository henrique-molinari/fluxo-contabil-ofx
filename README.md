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

