// Login.jsx
// Tela de entrada. Depois de logar, o App mostra só os módulos que o perfil pode usar.
import { useState } from "react";
import { Landmark, LogIn } from "lucide-react";
import { MiniSpinner } from "../../compartilhado/Carregando.jsx";
import { useAuth } from "./AuthContext.jsx";

export default function Login() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Envia o formulário: se o login falhar, mostra a mensagem da API
  async function enviar(e) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await entrar(email, senha);
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  return (
    <div className="login-fundo">
      <form className="login-caixa" onSubmit={enviar}>
        <div className="marca-icone login-icone"><Landmark size={22} /></div>
        <h1>Fluxo Contábil</h1>
        <p>Entre com seu e-mail e senha</p>

        {erro && <div className="alerta erro">{erro}</div>}

        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required autoFocus />
        </label>
        <label>
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
        </label>

        <button className="botao" disabled={enviando}>
          {enviando ? <MiniSpinner /> : <LogIn size={16} />} Entrar
        </button>
      </form>
    </div>
  );
}
