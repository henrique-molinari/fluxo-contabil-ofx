// TabelaUsuarios.jsx
// Tabela da equipe: troca de perfil, situação (ativo/desativado) e ações por usuário.
// "meuId" é o usuário logado: a própria conta não pode mudar de perfil nem se desativar
// (a API também bloqueia).
import { KeyRound } from "lucide-react";
import { NOME_PERFIL } from "../../compartilhado/formatos.js";
import Botao from "../../compartilhado/Botao.jsx";
import Selo from "../../compartilhado/Selo.jsx";
import Tabela from "../../compartilhado/Tabela.jsx";

export default function TabelaUsuarios({ usuarios, meuId, aoAtualizar, aoRedefinirSenha }) {
  const colunas = [
    {
      titulo: "Nome",
      render: (u) => (
        <>
          <b>{u.nome}</b>
          {u.id === meuId && <Selo cor="verde" className="margem-esq">você</Selo>}
        </>
      ),
    },
    { titulo: "E-mail", render: (u) => u.email },
    {
      titulo: "Perfil",
      render: (u) => (
        <select value={u.perfil} disabled={u.id === meuId} onChange={(e) => aoAtualizar(u.id, { perfil: e.target.value })}>
          {Object.entries(NOME_PERFIL).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
        </select>
      ),
    },
    { titulo: "Situação", render: (u) => (u.ativo ? <Selo cor="verde">Ativo</Selo> : <Selo>Desativado</Selo>) },
    {
      titulo: "",
      alinhar: "direita",
      render: (u) => (
        <div className="acoes sem-margem" style={{ justifyContent: "flex-end" }}>
          <Botao variante="claro" pequeno icone={KeyRound} onClick={() => aoRedefinirSenha(u)}>Senha</Botao>
          {u.id !== meuId && (
            <Botao variante={u.ativo ? "perigo" : "claro"} pequeno onClick={() => aoAtualizar(u.id, { ativo: !u.ativo })}>
              {u.ativo ? "Desativar" : "Reativar"}
            </Botao>
          )}
        </div>
      ),
    },
  ];

  return (
    <Tabela
      colunas={colunas}
      linhas={usuarios}
      chave={(u) => u.id}
      classeLinha={(u) => (u.ativo ? undefined : "apagada")}
    />
  );
}
