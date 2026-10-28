// useForm.js
// Hook para formulários que abrem e fecham dentro da tela (novo lançamento, nova tarefa...).
//
//   const formulario = useFormulario({ nome: "", email: "" }, { aoErro: avisarErro });
//   formulario.abrir();                       // abre com os campos vazios
//   <input {...formulario.ligar("nome")} />   // liga o campo ao estado (value + onChange)
//   <form onSubmit={formulario.enviar(salvar)}>   // salvar(valores) roda ao enviar
//
//  - valores: null quando o formulário está fechado;
//  - salvando: true enquanto a função de envio roda (para desabilitar o botão);
//  - se a função de envio lançar um erro, ele é entregue em aoErro(mensagem).
import { useState } from "react";

export function useFormulario(valoresVazios, { aoErro } = {}) {
  const [valores, setValores] = useState(null); // null = fechado
  const [salvando, setSalvando] = useState(false);

  // Devolve as propriedades de um campo controlado
  const ligar = (campo) => ({
    value: valores[campo],
    onChange: (e) => setValores((atual) => ({ ...atual, [campo]: e.target.value })),
  });

  // Cria o tratador do onSubmit: evita recarregar a página, marca "salvando" e captura erros
  const enviar = (acao) => async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await acao(valores);
    } catch (erro) {
      aoErro?.(erro.message);
    }
    setSalvando(false);
  };

  return {
    valores,
    salvando,
    ligar,
    enviar,
    abrir: () => setValores({ ...valoresVazios }),
    fechar: () => setValores(null),
  };
}
