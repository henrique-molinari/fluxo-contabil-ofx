// AUTORIZAÇÃO: o que cada perfil pode fazer.
// A autenticação responde "quem é você?" (login/JWT). Aqui respondemos "o que você pode fazer?".
// As rotas pedem uma permissão (ex.: autorizar("analise:ler")), nunca um perfil direto.
// Assim, mudar o acesso de um perfil é editar só este arquivo.

export const PERFIS = {
  ANALISTA: "ANALISTA",     // analista fiscal: analisa, altera contas e comenta
  ESTAGIARIO: "ESTAGIARIO", // estagiário: lança dados, acesso bem restrito
  GESTOR: "GESTOR",         // head: acompanha gráficos, pede balanços e delega tarefas
};

export const PERMISSOES = {
  // contas
  "movimentacoes:ler": [PERFIS.ANALISTA, PERFIS.ESTAGIARIO, PERFIS.GESTOR],
  "movimentacoes:criar": [PERFIS.ANALISTA, PERFIS.ESTAGIARIO],
  "movimentacoes:editar": [PERFIS.ANALISTA],
  "movimentacoes:apagar": [PERFIS.ANALISTA],
  // entrada de dados
  "importacao:criar": [PERFIS.ANALISTA, PERFIS.ESTAGIARIO],
  // comentários nas contas
  "comentarios:ler": [PERFIS.ANALISTA, PERFIS.GESTOR],
  "comentarios:criar": [PERFIS.ANALISTA],
  // gráficos e relatórios (o estagiário não vê nem tira)
  "analise:ler": [PERFIS.ANALISTA, PERFIS.GESTOR],
  "relatorios:exportar": [PERFIS.ANALISTA, PERFIS.GESTOR],
  // tarefas delegadas
  "tarefas:ler": [PERFIS.ANALISTA, PERFIS.ESTAGIARIO, PERFIS.GESTOR],
  "tarefas:criar": [PERFIS.GESTOR],
  "tarefas:atualizar": [PERFIS.ANALISTA, PERFIS.ESTAGIARIO, PERFIS.GESTOR],
  "tarefas:excluir": [PERFIS.GESTOR],
  // administração de usuários
  "usuarios:gerenciar": [PERFIS.GESTOR],
};

export function temPermissao(perfil, permissao) {
  return PERMISSOES[permissao]?.includes(perfil) ?? false;
}

export function permissoesDoPerfil(perfil) {
  return Object.keys(PERMISSOES).filter((p) => temPermissao(perfil, p));
}
