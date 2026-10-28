// AuthContext.jsx
// Guarda quem está logado e expõe: usuario, entrar(), sair() e pode("permissao").
// O "pode" usa a lista de permissões que o backend manda no login, assim o menu
// só mostra o que o perfil realmente tem acesso. (A segurança de verdade continua no backend.)
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { definirAoExpirar, sessao } from "../../compartilhado/http.js";
import { authApi } from "./auth.api.js";

// Contexto = jeito do React de compartilhar dados com todas as telas sem passar props
const Contexto = createContext(null);
export const useAuth = () => useContext(Contexto);

// Envolve o app inteiro (veja App.jsx) para qualquer tela poder chamar useAuth()
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => sessao.ler()?.usuario ?? null);
  const [verificando, setVerificando] = useState(() => Boolean(sessao.ler()));

  // Esquece a sessão (logout ou sessão expirada)
  const limpar = useCallback(() => { sessao.limpar(); setUsuario(null); }, []);

  useEffect(() => {
    definirAoExpirar(limpar);
    // Se já havia sessão salva, confirma com o backend (perfil pode ter mudado)
    if (!sessao.ler()) return;
    authApi.eu()
      .then((u) => {
        sessao.salvar({ ...sessao.ler(), usuario: u });
        setUsuario(u);
      })
      .catch(limpar)
      .finally(() => setVerificando(false));
  }, [limpar]);

  // Faz o login e guarda a sessão (tokens + dados do usuário)
  const entrar = useCallback(async (email, senha) => {
    const dados = await authApi.login(email, senha);
    sessao.salvar(dados);
    setUsuario(dados.usuario);
  }, []);

  // Avisa a API para invalidar o refresh token e esquece a sessão
  const sair = useCallback(async () => {
    const refreshToken = sessao.ler()?.refreshToken;
    if (refreshToken) await authApi.logout(refreshToken).catch(() => {});
    limpar();
  }, [limpar]);

  // Diz se o usuário logado tem uma permissão (ex.: pode("analise:ler"))
  const pode = useCallback(
    (permissao) => Boolean(usuario?.permissoes?.includes(permissao)),
    [usuario]
  );

  // useMemo evita recriar o objeto a cada renderização; todas as dependências estão listadas
  const valor = useMemo(
    () => ({ usuario, verificando, entrar, sair, pode }),
    [usuario, verificando, entrar, sair, pode]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
