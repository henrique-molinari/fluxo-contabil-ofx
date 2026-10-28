// App.jsx
// Componente principal. Sem login mostra a tela de entrada; logado, mostra o sistema.
import { Carregando } from "./shared/Loading.jsx";
import { AuthProvider, useAuth } from "./modules/auth/AuthContext.jsx";
import Login from "./modules/auth/Login.jsx";
import Sistema from "./System.jsx";

// Decide o que mostrar: spinner (checando sessão), login ou o sistema
function Porteiro() {
  const { usuario, verificando } = useAuth();
  if (verificando) return <Carregando texto="Verificando sessão..." />;
  return usuario ? <Sistema key={usuario.id} /> : <Login />;
}

// AuthProvider deixa o usuário logado disponível para todas as telas
export default function App() {
  return (
    <AuthProvider>
      <Porteiro />
    </AuthProvider>
  );
}
