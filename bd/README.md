# bd

Scripts SQL do PostgreSQL. Ficam em `migracoes/`, numerados na ordem em que devem rodar.

| Arquivo | O que cria |
| --- | --- |
| `001_usuarios.sql` | `usuarios` e `refresh_tokens` |
| `002_movimentacoes.sql` | `movimentacoes` (preserva dados da versão antiga) |
| `003_comentarios.sql` | `comentarios` |
| `004_tarefas.sql` | `tarefas` |
| `005_usuarios_teste.sql` | 3 usuários de teste, um por perfil (senha `Mudar@123`) |

Para aplicar (a partir da pasta `backend/`):

```bash
npm run db:migrar   # roda só o que ainda não foi aplicado
npm run db:seed     # cria os 3 usuários de exemplo
```

O controle do que já rodou fica na tabela `migracoes_aplicadas`. Para mudar o banco, **crie um arquivo novo** (`005_...sql`) em vez de editar um antigo.
