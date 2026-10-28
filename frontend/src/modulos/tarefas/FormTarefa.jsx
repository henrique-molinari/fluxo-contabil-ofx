// FormTarefa.jsx
// Formulário para o gestor delegar uma tarefa. "equipe" é a lista de pessoas que podem recebê-la.
import Botao from "../../compartilhado/Botao.jsx";
import Campo from "../../compartilhado/Campo.jsx";
import { TIPOS } from "./constantes.js";

// "formulario" é o objeto do useFormulario; "aoSalvar" recebe os valores digitados
export default function FormTarefa({ formulario, aoSalvar, equipe }) {
  const { valores, salvando, ligar, enviar, fechar } = formulario;
  // Formulário fechado: não desenha nada
  if (!valores) return null;

  return (
    <form className="form-linha" onSubmit={enviar(aoSalvar)}>
      <Campo rotulo="Título" className="cresce">
        <input type="text" required minLength={3} maxLength={160} placeholder="Ex.: Balanço de setembro"
          {...ligar("titulo")} />
      </Campo>
      <Campo rotulo="Tipo">
        <select {...ligar("tipo")}>
          {Object.entries(TIPOS).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
        </select>
      </Campo>
      <Campo rotulo="Responsável">
        <select required {...ligar("atribuido_a")}>
          <option value="">Escolha...</option>
          {/* O gestor delega para a equipe, não para ele mesmo */}
          {equipe.filter((u) => u.perfil !== "GESTOR").map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
        </select>
      </Campo>
      <Campo rotulo="Prazo">
        <input type="date" {...ligar("prazo")} />
      </Campo>
      <Campo rotulo="Detalhes (opcional)" className="cresce linha-inteira">
        <input type="text" maxLength={2000} {...ligar("descricao")} />
      </Campo>
      <Botao carregando={salvando}>Delegar</Botao>
      <Botao type="button" variante="claro" onClick={fechar}>Cancelar</Botao>
    </form>
  );
}
