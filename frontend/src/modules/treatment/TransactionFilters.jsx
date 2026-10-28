// TransactionFilters.jsx
// Barra acima da tabela: busca pela descrição, filtro por categoria e contagem de resultados.
import { Search } from "lucide-react";

export default function FiltrosMovimentacoes({ busca, aoBuscar, categoria, aoMudarCategoria, categorias, quantidade }) {
  return (
    <div className="filtros">
      <div className="campo-busca">
        <Search size={16} />
        <input type="search" placeholder="Buscar pela descrição" value={busca}
          onChange={(e) => aoBuscar(e.target.value)} />
      </div>
      <select value={categoria} onChange={(e) => aoMudarCategoria(e.target.value)}>
        <option>Todas</option>
        {categorias.map((c) => <option key={c}>{c}</option>)}
      </select>
      <span className="contagem">{quantidade} resultado(s)</span>
    </div>
  );
}
