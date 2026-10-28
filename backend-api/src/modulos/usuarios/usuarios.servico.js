// Regras da gestão de usuários (só o gestor usa).
import bcrypt from "bcryptjs";
import { ErroHttp, naoEncontrado } from "../../compartilhado/erros.js";
import { authServico } from "../auth/auth.servico.js";
import { usuariosRepositorio } from "./usuarios.repositorio.js";

export class UsuariosServico {
  // Repositório e serviço de autenticação (para derrubar sessões) entram pelo construtor
  constructor(repositorio = usuariosRepositorio, autenticacao = authServico) {
    this.repositorio = repositorio;
    this.autenticacao = autenticacao;
  }

  // Lista a equipe
  listar() {
    return this.repositorio.listar();
  }

  // Cadastra um usuário novo; a senha é guardada como hash bcrypt (nunca em texto)
  async criar({ nome, email, senha, perfil }) {
    const senhaHash = await bcrypt.hash(senha, 10);
    return this.repositorio.criar({ nome, email, senhaHash, perfil }).catch((e) => {
      if (e.code === "23505") throw new ErroHttp(409, "Já existe um usuário com este e-mail.");
      throw e;
    });
  }

  // Edita nome, perfil ou ativa/desativa. Desativar também derruba as sessões abertas da pessoa.
  async atualizar(id, dados, quemPediu) {
    // Evita o gestor se trancar para fora do sistema
    const mexeNaPropriaConta = id === quemPediu.id;
    if (mexeNaPropriaConta && (dados.ativo === false || (dados.perfil && dados.perfil !== quemPediu.perfil))) {
      throw new ErroHttp(400, "Você não pode desativar nem mudar o perfil da sua própria conta.");
    }

    const atualizado = await this.repositorio.atualizar(id, dados);
    if (!atualizado) throw naoEncontrado("Usuário");
    if (dados.ativo === false) await this.autenticacao.revogarTodos(id);
    return atualizado;
  }

  // O gestor define uma senha nova; todas as sessões antigas do usuário são encerradas
  async redefinirSenha(id, senhaNova) {
    const alterados = await this.repositorio.atualizarSenha(id, await bcrypt.hash(senhaNova, 10));
    if (!alterados) throw naoEncontrado("Usuário");
    await this.autenticacao.revogarTodos(id);
    return { ok: true };
  }
}

// Instância única usada pelas rotas
export const usuariosServico = new UsuariosServico();
