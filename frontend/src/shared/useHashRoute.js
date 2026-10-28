// useHashRoute.js
// Navegação simples pela URL, sem biblioteca de rotas: o módulo aberto fica no "#" do endereço
// (ex.: http://localhost:5173/#tarefas). Assim o botão "voltar" do navegador funciona
// e dá para copiar/colar o link de uma tela.
//   const [rota, irPara] = useHashRota();
//   irPara("tratamento");   // muda o endereço para #tratamento
import { useEffect, useState } from "react";

// Lê o que vem depois do "#" no endereço atual
const lerHash = () => window.location.hash.slice(1);

export function useHashRota() {
  const [rota, setRota] = useState(lerHash);

  // Quando o endereço muda (voltar/avançar ou irPara), atualiza a tela
  useEffect(() => {
    const aoMudar = () => setRota(lerHash());
    window.addEventListener("hashchange", aoMudar);
    return () => window.removeEventListener("hashchange", aoMudar);
  }, []);

  const irPara = (destino) => { window.location.hash = destino; };
  return [rota, irPara];
}
