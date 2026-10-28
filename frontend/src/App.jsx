// App.jsx
// Componente principal. Sem login mostra a tela de entrada; logado, mostra o sistema.
import { Carregando } from "./compartilhado/Carregando.jsx";
import { AuthProvider, useAuth } from "./modulos/auth/AuthContext.jsx";
import Login from "./modulos/auth/Login.jsx";
import Sistema from "./Sistema.jsx";

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
