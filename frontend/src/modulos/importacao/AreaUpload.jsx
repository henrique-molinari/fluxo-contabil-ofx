// AreaUpload.jsx
// Área de "arraste o arquivo aqui" (ou clique para escolher). Avisa a tela pelo
// aoEscolher(arquivo) assim que o usuário escolhe ou solta um arquivo.
// Enquanto o arquivo está sendo lido (lendo = true), mostra o carregamento no lugar.
import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { Carregando } from "../../compartilhado/Carregando.jsx";
import Painel from "../../compartilhado/Painel.jsx";

export default function AreaUpload({ lendo, aoEscolher }) {
  const [arrastando, setArrastando] = useState(false); // arquivo está por cima da área

  return (
    <Painel>
      {lendo ? (
        <Carregando texto="Lendo o arquivo OFX..." />
      ) : (
        <label
          className={arrastando ? "upload sobre" : "upload"}
          onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            aoEscolher(e.dataTransfer.files[0]);
          }}
        >
          <input type="file" accept=".ofx" hidden onChange={(e) => aoEscolher(e.target.files[0])} />
          <div className="icone-vazio"><UploadCloud size={30} /></div>
          <b>Arraste o arquivo .ofx aqui</b>
          <span>ou clique para escolher no computador</span>
          <small>Use o extrato exportado do seu banco</small>
        </label>
      )}
    </Painel>
  );
}
