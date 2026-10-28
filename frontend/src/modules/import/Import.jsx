// Import.jsx
// Módulo de importação. Ele só cuida de enviar um arquivo OFX pro banco
// (a classificação das contas ficou no módulo Tratamento).
// O fluxo tem 3 etapas: 1) escolher o arquivo  2) conferir a prévia  3) concluído.
// Depois de concluir dá pra importar OUTRO arquivo clicando no botão.
// Cada etapa é um componente: AreaUpload, PreviaImportacao e ResultadoImportacao.
import { useState } from "react";
import Alerta from "../../shared/Alert.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import AreaUpload from "./UploadArea.jsx";
import { importacaoApi } from "./import.api.js";
import IndicadorEtapas from "./StepIndicator.jsx";
import PreviaImportacao from "./ImportPreview.jsx";
import ResultadoImportacao from "./ImportResult.jsx";

export default function Importacao({ irPara }) {
  const { pode } = useAuth();
  const [etapa, setEtapa] = useState(1);            // 1, 2 ou 3
  const [arquivo, setArquivo] = useState(null);     // arquivo escolhido pelo usuário
  const [previa, setPrevia] = useState([]);         // linhas da prévia
  const [resultado, setResultado] = useState(null); // {inseridas, duplicadas}
  const [importando, setImportando] = useState(false); // gravando no banco
  const [lendo, setLendo] = useState(false);        // lendo o arquivo (gerando prévia)
  const [erro, setErro] = useState("");

  // Quando o usuário escolhe (ou arrasta) o arquivo, já gero a prévia
  async function escolherArquivo(file) {
    if (!file) return;
    setErro("");
    setArquivo(file);
    setLendo(true);
    try {
      setPrevia(await importacaoApi.preview(file));
      setEtapa(2);
    } catch (e) {
      setErro(e.message);
      setArquivo(null);
    }
    setLendo(false);
  }

  // Botão "Importar": grava no banco
  async function importar() {
    setImportando(true);
    setErro("");
    try {
      setResultado(await importacaoApi.importar(arquivo));
      setEtapa(3);
    } catch (e) {
      setErro(e.message);
    }
    setImportando(false);
  }

  // Volta tudo pro começo pra poder importar um novo OFX
  function novoArquivo() {
    setEtapa(1);
    setArquivo(null);
    setPrevia([]);
    setResultado(null);
    setErro("");
  }

  return (
    <>
      <IndicadorEtapas etapa={etapa} />
      <Alerta tipo="erro">{erro}</Alerta>

      {etapa === 1 && <AreaUpload lendo={lendo} aoEscolher={escolherArquivo} />}

      {etapa === 2 && (
        <PreviaImportacao
          nomeArquivo={arquivo?.name}
          previa={previa}
          importando={importando}
          aoImportar={importar}
          aoEscolherOutro={novoArquivo}
        />
      )}

      {etapa === 3 && resultado && (
        <ResultadoImportacao
          resultado={resultado}
          podeVerAnalise={pode("analise:ler")}
          aoImportarOutro={novoArquivo}
          irPara={irPara}
        />
      )}
    </>
  );
}
