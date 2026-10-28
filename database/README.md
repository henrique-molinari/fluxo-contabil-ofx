# database

Scripts SQL do PostgreSQL. Ficam em `migrations/`, numerados na ordem em que devem rodar. As tabelas são criadas por estes scripts; o backend as lê e grava pelos models do Sequelize (`backend-api/src/shared/models/`), então ao mudar uma tabela atualize também o model correspondente.

| Arquivo | O que cria |
| --- | --- |
| `001_users.sql` | `usuarios` e `refresh_tokens` |
| `002_transactions.sql` | `movimentacoes` (preserva dados da versão antiga) |
| `003_comments.sql` | `comentarios` |
| `004_tasks.sql` | `tarefas` |
| `005_test_users.sql` | 3 usuários de teste, um por perfil (senha `Mudar@123`) |

Para aplicar (a partir da pasta `backend-api/`):

```bash
npm run db:migrar   # roda só o que ainda não foi aplicado
npm run db:seed     # cria os 3 usuários de exemplo
```

O controle do que já rodou fica na tabela `migracoes_aplicadas`. Para mudar o banco, **crie um arquivo novo** (`006_...sql`) em vez de editar um antigo.
