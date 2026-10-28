// constants.js
// Textos amigáveis para os códigos que a API de tarefas usa, e os valores iniciais do formulário.

// Andamento da tarefa: Pendente -> Em andamento -> Concluída
export const STATUS = { PENDENTE: "Pendente", EM_ANDAMENTO: "Em andamento", CONCLUIDA: "Concluída" };

// Tipo da tarefa (BALANCO = pedido de balanço)
export const TIPOS = { GERAL: "Geral", BALANCO: "Balanço" };

// Valores iniciais do formulário de nova tarefa
export const FORM_VAZIO = { titulo: "", descricao: "", tipo: "BALANCO", atribuido_a: "", prazo: "" };
