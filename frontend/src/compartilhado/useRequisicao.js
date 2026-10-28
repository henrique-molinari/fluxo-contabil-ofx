// useRequisicao.js
// Hook que busca dados na API quando a tela abre. Antes cada tela repetia o mesmo
// useState + useEffect + tratamento de erro; agora é só:
//
//   const { dados, setDados, erro, carregando, recarregar } = useRequisicao(() => api.listar());
//
//  - dados: null enquanto carrega; depois o que a API devolveu;
//  - setDados: para atualizar a lista na tela sem precisar buscar tudo de novo;
//  - erro: texto do erro (vazio se deu certo);
//  - carregando: true até chegar a resposta ou o erro;
//  - recarregar(): busca de novo (ex.: depois de importar ou apagar).
// O segundo argumento são as "dependências": quando mudam, a busca é refeita.
import { useCallback, useEffect, useRef, useState } from "react";

export function useRequisicao(buscar, dependencias = []) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  // Guarda a função mais recente sem precisar refazer a busca a cada renderização
  const buscarRef = useRef(buscar);
  buscarRef.current = buscar;

  // Busca de novo, sob demanda
  const recarregar = useCallback(async () => {
    try {
      setDados(await buscarRef.current());
      setErro("");
    } catch (e) {
      setErro(e.message);
    }
  }, []);

  useEffect(() => {
    // "ativo" evita atualizar a tela se ela já foi fechada (ou se as dependências mudaram)
    let ativo = true;
    setDados(null);
    setErro("");
    buscarRef.current()
      .then((resultado) => ativo && setDados(resultado))
      .catch((e) => ativo && setErro(e.message));
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);

  return { dados, setDados, erro, carregando: dados === null && !erro, recarregar };
}
