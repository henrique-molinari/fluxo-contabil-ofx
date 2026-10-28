// Repositório de usuários: SQL de cadastro e manutenção da tabela "usuarios".
import { consultar } from "../../shared/db.js";

// Nunca devolvemos senha_hash para o cliente
const COLUNAS = "id, nome, email, perfil, ativo, criado_em";

export class UsuariosRepositorio {
  // Lista a equipe em ordem alfabética
  async listar() {
    const { rows } = await consultar(`SELECT ${COLUNAS} FROM usuarios ORDER BY nome`);
    return rows;
  }

  // Cadastra um usuário novo (a senha já chega como hash)
  async criar({ nome, email, senhaHash, perfil }) {
    const { rows } = await consultar(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES ($1, $2, $3, $4) RETURNING ${COLUNAS}`,
      [nome, email, senhaHash, perfil]
    );
    return rows[0];
  }

  // Atualização parcial: COALESCE mantém o valor atual dos campos não enviados
  async atualizar(id, { nome, perfil, ativo }) {
    const { rows } = await consultar(
      `UPDATE usuarios SET nome = COALESCE($2, nome), perfil = COALESCE($3, perfil), ativo = COALESCE($4, ativo)
       WHERE id = $1 RETURNING ${COLUNAS}`,
      [id, nome ?? null, perfil ?? null, ativo ?? null]
    );
    return rows[0];
  }

  // Troca o hash da senha; devolve quantas linhas foram alteradas (0 = usuário não existe)
  async atualizarSenha(id, senhaHash) {
    const { rowCount } = await consultar("UPDATE usuarios SET senha_hash = $2 WHERE id = $1", [id, senhaHash]);
    return rowCount;
  }
}

// Instância única usada pelo restante da aplicação
export const usuariosRepositorio = new UsuariosRepositorio();
