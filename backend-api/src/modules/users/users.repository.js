// Repositório de usuários: cadastro e manutenção através do model Usuario.
import { Usuario } from "../../shared/models/index.js";

// Nunca devolvemos senha_hash para o cliente
const COLUNAS = ["id", "nome", "email", "perfil", "ativo", "criado_em"];

// Converte uma instância do model em objeto simples, só com as colunas públicas
const paraObjeto = (instancia) => Object.fromEntries(COLUNAS.map((c) => [c, instancia.get(c)]));

export class UsuariosRepositorio {
  // Lista a equipe em ordem alfabética
  async listar() {
    return Usuario.findAll({ attributes: COLUNAS, order: [["nome", "ASC"]], raw: true });
  }

  // Cadastra um usuário novo (a senha já chega como hash)
  async criar({ nome, email, senhaHash, perfil }) {
    const criado = await Usuario.create({ nome, email, senha_hash: senhaHash, perfil });
    return paraObjeto(criado);
  }

  // Atualização parcial: só muda os campos enviados. Devolve undefined se o id não existe.
  async atualizar(id, { nome, perfil, ativo }) {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) return undefined;

    const alteracoes = {};
    if (nome != null) alteracoes.nome = nome;
    if (perfil != null) alteracoes.perfil = perfil;
    if (ativo != null) alteracoes.ativo = ativo;
    await usuario.update(alteracoes);
    return paraObjeto(usuario);
  }

  // Troca o hash da senha; devolve quantas linhas foram alteradas (0 = usuário não existe)
  async atualizarSenha(id, senhaHash) {
    const [alteradas] = await Usuario.update({ senha_hash: senhaHash }, { where: { id } });
    return alteradas;
  }
}

// Instância única usada pelo restante da aplicação
export const usuariosRepositorio = new UsuariosRepositorio();
