// Sistema.jsx
// Layout do sistema (só aparece logado): menu lateral + o módulo escolhido.
// O módulo aberto fica no endereço da página (#tarefas, #analise...), então "voltar" funciona.
import { useHashRota } from "./compartilhado/useHashRota.js";
import Alerta from "./compartilhado/Alerta.jsx";
import { useAuth } from "./modulos/auth/AuthContext.jsx";
import MenuLateral from "./MenuLateral.jsx";
import { MODULOS } from "./registroModulos.js";

export default function Sistema() {
  const { usuario, pode, sair } = useAuth();
  const [rota, irPara] = useHashRota();

  // Filtra os módulos pelo que o perfil pode usar
  const permitidos = MODULOS.filter((m) => pode(m.permissao));
  // Endereço desconhecido (ou sem permissão) cai no primeiro módulo permitido
  const modulo = permitidos.find((m) => m.id === rota) ?? permitidos[0];

  if (!modulo) {
    return <Alerta tipo="erro">Seu perfil ainda não tem acesso a nenhum módulo.</Alerta>;
  }
  const Pagina = modulo.componente;

  return (
    <div className="layout">
      <MenuLateral
        modulos={permitidos}
        moduloAtual={modulo.id}
        aoEscolher={irPara}
        usuario={usuario}
        aoSair={sair}
      />

      <main className="conteudo">
        <header className="topo">
          <div className="trilha">Fluxo Contábil / {modulo.grupo}</div>
          <h1>{modulo.nome}</h1>
          <p>{modulo.descricao}</p>
        </header>
        {/* key faz a página recarregar os dados quando troco de módulo */}
        <Pagina key={modulo.id} irPara={irPara} />
      </main>
    </div>
  );
}
