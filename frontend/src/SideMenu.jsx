// SideMenu.jsx
// Menu da esquerda: marca do sistema, módulos agrupados por seção e o usuário logado com o botão "Sair".
// Recebe só os módulos que o perfil pode usar (o filtro por permissão é feito em System.jsx).
import { Landmark, LogOut } from "lucide-react";
import { NOME_PERFIL } from "./shared/formats.js";

export default function MenuLateral({ modulos, moduloAtual, aoEscolher, usuario, aoSair }) {
  // Seções do menu, sem repetir (Visão geral, Dados, Saída...)
  const grupos = [...new Set(modulos.map((m) => m.grupo))];

  return (
    <aside className="menu">
      <div className="marca">
        <div className="marca-icone"><Landmark size={20} /></div>
        <div>
          <strong>Fluxo Contábil</strong>
          <small>Extratos OFX</small>
        </div>
      </div>

      <nav>
        {grupos.map((grupo) => (
          <div key={grupo}>
            <div className="grupo-menu">{grupo}</div>
            {modulos.filter((m) => m.grupo === grupo).map(({ id, nome, Icone }) => (
              <button
                key={id}
                className={id === moduloAtual ? "item ativo" : "item"}
                onClick={() => aoEscolher(id)}
              >
                <Icone size={18} /> {nome}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="rodape-menu">
        <div className="usuario-menu">
          <strong>{usuario.nome}</strong>
          <small>{NOME_PERFIL[usuario.perfil]}</small>
        </div>
        <button className="icone-botao claro-escuro" onClick={aoSair} aria-label="Sair" title="Sair">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
