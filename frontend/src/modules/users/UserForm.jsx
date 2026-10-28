// UserForm.jsx
// Formulário de cadastro de um usuário novo (nome, e-mail, senha inicial e perfil).
import Botao from "../../shared/Button.jsx";
import Campo from "../../shared/Field.jsx";
import { NOME_PERFIL } from "../../shared/formats.js";

// "formulario" é o objeto do useFormulario; "aoSalvar" recebe os valores digitados
export default function FormUsuario({ formulario, aoSalvar }) {
  const { valores, salvando, ligar, enviar, fechar } = formulario;
  // Formulário fechado: não desenha nada
  if (!valores) return null;

  return (
    <form className="form-linha" onSubmit={enviar(aoSalvar)}>
      <Campo rotulo="Nome" className="cresce">
        <input type="text" required minLength={2} {...ligar("nome")} />
      </Campo>
      <Campo rotulo="E-mail" className="cresce">
        <input type="email" required {...ligar("email")} />
      </Campo>
      <Campo rotulo="Senha inicial">
        <input type="password" required minLength={8} autoComplete="new-password" {...ligar("senha")} />
      </Campo>
      <Campo rotulo="Perfil">
        <select {...ligar("perfil")}>
          {Object.entries(NOME_PERFIL).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
        </select>
      </Campo>
      <Botao carregando={salvando}>Cadastrar</Botao>
      <Botao type="button" variante="claro" onClick={fechar}>Cancelar</Botao>
    </form>
  );
}
