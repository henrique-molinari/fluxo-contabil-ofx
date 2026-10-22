# api

Documentação e testes da API. Base: `http://localhost:3333/api`.

```
api/
├── insomnia/ofx-insomnia.json   # coleção do Insomnia
└── exemplos/                    # .ofx para testar a importação
```

## Testando no Insomnia

1. Suba o banco e a API (`npm run db:migrar`, `npm run db:seed`, `npm run dev` na pasta `backend`).
2. No Insomnia: **Import** → escolha `api/insomnia/ofx-insomnia.json`.
3. As requisições de upload apontam para os arquivos de `api/exemplos/` pelo **caminho completo desta máquina**. Se o projeto estiver em outra pasta, reabra a requisição, vá em *Body* e escolha o arquivo de novo.
4. As variáveis (URL, e-mails e senha dos 3 perfis) estão em **Manage Environments**.

**Como o token funciona:** cada requisição já usa o login do perfil dela (`Login analista`, `Login estagiario`, `Login gestor`), encadeado pelo Insomnia. O login é refeito sozinho quando o token tem mais de 10 minutos. Você não copia token nenhum.

**Pastas:** `01 Autenticação` (401) · `02 Analista fiscal` · `03 Estagiário` · `04 Gestor` (inclui o fluxo de tarefa delegada) · `05 Validação e erros`. Requisições marcadas com *(PROIBIDO)* devem responder **403**.

**Testes:** aba **Test** do Insomnia, 6 suítes e 78 testes (um por requisição, conferindo status e partes do corpo). Rode as suítes **na ordem** — as pastas dependem umas das outras (ex.: o gestor delega uma tarefa que o analista depois conclui). O limite de logins é 20 a cada 15 minutos por IP; para rodar tudo várias vezes seguidas, suba a API com `NODE_ENV=test`.

## Rotas

Legenda: 🔓 pública · 🔑 só precisa estar logado · demais exigem a permissão indicada (veja os perfis em [`permissoes.js`](../backend/src/config/permissoes.js)).

### Auth
| Método | Rota | Acesso |
| --- | --- | --- |
| GET | `/saude` | 🔓 |
| POST | `/auth/login` `{email, senha}` | 🔓 |
| POST | `/auth/refresh` `{refreshToken}` | 🔓 |
| POST | `/auth/logout` `{refreshToken}` | 🔓 |
| GET | `/auth/eu` | 🔑 |
| POST | `/auth/trocar-senha` `{senhaAtual, senhaNova}` | 🔑 |

### Usuários — `usuarios:gerenciar` (gestor)
| Método | Rota |
| --- | --- |
| GET | `/usuarios` |
| POST | `/usuarios` `{nome, email, senha, perfil}` |
| PATCH | `/usuarios/:id` `{nome?, perfil?, ativo?}` |
| POST | `/usuarios/:id/redefinir-senha` `{senhaNova}` |

### Importação — `importacao:criar` (analista, estagiário)
| Método | Rota |
| --- | --- |
| POST | `/importacao/preview` (multipart, campo `arquivo`) — não grava nada |
| POST | `/importacao` (multipart, campo `arquivo`) |

### Tratamento (contas)
| Método | Rota | Permissão |
| --- | --- | --- |
| GET | `/categorias` | `movimentacoes:ler` |
| GET | `/movimentacoes?busca&categoria&de&ate` | `movimentacoes:ler` |
| POST | `/movimentacoes` `{data_movimentacao, valor, descricao, categoria?}` | `movimentacoes:criar` |
| PATCH | `/movimentacoes/:id` | `movimentacoes:editar` |
| POST | `/movimentacoes/classificar-automatico` | `movimentacoes:editar` |
| DELETE | `/movimentacoes/:id` · `/movimentacoes` (todas) | `movimentacoes:apagar` |

### Comentários
| Método | Rota | Permissão |
| --- | --- | --- |
| GET | `/movimentacoes/:id/comentarios` | `comentarios:ler` |
| POST | `/movimentacoes/:id/comentarios` `{texto}` | `comentarios:criar` |
| DELETE | `/comentarios/:id` (só o autor) | `comentarios:criar` |

### Análise e exportação
| Método | Rota | Permissão |
| --- | --- | --- |
| GET | `/analise/resumo?de&ate` | `analise:ler` |
| GET | `/exportacao/:formato` (`csv`, `xlsx`, `txt`, `ofx`) | `relatorios:exportar` |

### Tarefas
| Método | Rota | Permissão |
| --- | --- | --- |
| GET | `/tarefas?status&atribuido_a` (gestor vê todas; os outros, só as suas) | `tarefas:ler` |
| POST | `/tarefas` `{titulo, descricao?, tipo, atribuido_a, prazo?}` | `tarefas:criar` |
| PATCH | `/tarefas/:id/status` `{status}` (dono da tarefa ou gestor) | `tarefas:atualizar` |
| DELETE | `/tarefas/:id` | `tarefas:excluir` |

## Respostas de erro

Sempre JSON: `{ "erro": "mensagem", "detalhes": [...] }`.

| Código | Quando |
| --- | --- |
| 400 | Dados inválidos (`detalhes` lista os campos) |
| 401 | Sem token, token inválido/expirado ou usuário inativo |
| 403 | Logado, mas o perfil não tem permissão |
| 404 | Registro ou rota inexistente |
| 409 | Registro duplicado (e-mail, movimentação igual) |
| 413 / 422 | Arquivo grande demais (máx. 5 MB) / OFX inválido |
