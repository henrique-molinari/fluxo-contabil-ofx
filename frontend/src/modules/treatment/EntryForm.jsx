// EntryForm.jsx
// Formulário de lançamento manual de uma conta (data, tipo, valor e descrição).
// O estado do formulário vem do hook useFormulario, criado na tela de Tratamento.
import Botao from "../../shared/Button.jsx";
import Campo from "../../shared/Field.jsx";

// "formulario" é o objeto do useFormulario; "aoSalvar" recebe os valores digitados
export default function FormLancamento({ formulario, aoSalvar }) {
  const { valores, salvando, ligar, enviar, fechar } = formulario;
  // Formulário fechado: não desenha nada
  if (!valores) return null;

  return (
    <form className="form-linha" onSubmit={enviar(aoSalvar)}>
      <Campo rotulo="Data">
        <input type="date" required {...ligar("data_movimentacao")} />
      </Campo>
      <Campo rotulo="Tipo">
        <select {...ligar("tipo")}>
          <option value="saida">Saída</option>
          <option value="entrada">Entrada</option>
        </select>
      </Campo>
      <Campo rotulo="Valor (R$)">
        <input type="text" inputMode="decimal" required placeholder="0,00" {...ligar("valor")} />
      </Campo>
      <Campo rotulo="Descrição" className="cresce">
        <input type="text" required maxLength={255} {...ligar("descricao")} />
      </Campo>
      <Botao carregando={salvando}>Salvar</Botao>
      <Botao type="button" variante="claro" onClick={fechar}>Cancelar</Botao>
    </form>
  );
}
