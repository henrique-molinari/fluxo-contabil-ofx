// Importacao.jsx
// Módulo de importação. Ele só cuida de enviar um arquivo OFX pro banco
// (a classificação das contas ficou no módulo Tratamento).
// O fluxo tem 3 etapas: 1) escolher o arquivo  2) conferir a prévia  3) concluído.
// Depois de concluir dá pra importar OUTRO arquivo clicando no botão.
import { useState } from "react";
import { CircleCheck, FileUp, UploadCloud } from "lucide-react";
import { importacaoApi } from "./importacao.api.js";
import { dataBR, dinheiro } from "../../compartilhado/formatos.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { Carregando, MiniSpinner } from "../../compartilhado/Carregando.jsx";

// Assistente em 3 etapas: 1) escolher o arquivo, 2) conferir a prévia, 3) ver o resultado
export default function Importacao({ irPara }) {
  const { pode } = useAuth();
  const [etapa, setEtapa] = useState(1);            // 1, 2 ou 3
  const [arquivo, setArquivo] = useState(null);     // arquivo escolhido pelo usuário
  const [previa, setPrevia] = useState([]);         // linhas da prévia
  const [resultado, setResultado] = useState(null); // {inseridas, duplicadas}
  const [carregando, setCarregando] = useState(false); // gravando no banco
  const [lendo, setLendo] = useState(false);        // lendo o arquivo (gerando prévia)
  const [arrastando, setArrastando] = useState(false); // arquivo está por cima da área
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
    setCarregando(true);
    setErro("");
    try {
      setResultado(await importacaoApi.importar(arquivo));
      setEtapa(3);
    } catch (e) {
      setErro(e.message);
    }
    setCarregando(false);
  }

  // Volta tudo pro começo pra poder importar um novo OFX
  function novoArquivo() {
    setEtapa(1);
    setArquivo(null);
    setPrevia([]);
    setResultado(null);
    setErro("");
  }

  // Conto quantas linhas da prévia são novas
  const novas = previa.filter((p) => !p.duplicada).length;

  // Nomes das etapas pra desenhar o indicador lá em cima
  const etapas = ["Selecionar arquivo", "Conferir dados", "Concluído"];

  return (
    <>
      {/* Indicador de etapas */}
      <ol className="etapas">
        {etapas.map((nome, i) => (
          <li key={nome} className={etapa === i + 1 ? "atual" : etapa > i + 1 ? "feita" : ""}>
            <span>{etapa > i + 1 ? "✓" : i + 1}</span> {nome}
          </li>
        ))}
      </ol>

      {erro && <div className="alerta erro">{erro}</div>}

      {/* ETAPA 1: escolher o arquivo */}
      {etapa === 1 && (
        <section className="painel">
          {lendo ? (
            <Carregando texto="Lendo o arquivo OFX..." />
          ) : (
            // Área de arrastar e soltar
            <label
              className={arrastando ? "upload sobre" : "upload"}
              onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
              onDragLeave={() => setArrastando(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastando(false);
                escolherArquivo(e.dataTransfer.files[0]);
              }}
            >
              <input type="file" accept=".ofx" hidden onChange={(e) => escolherArquivo(e.target.files[0])} />
              <div className="icone-vazio"><UploadCloud size={30} /></div>
              <b>Arraste o arquivo .ofx aqui</b>
              <span>ou clique para escolher no computador</span>
              <small>Use o extrato exportado do seu banco</small>
            </label>
          )}
        </section>
      )}

      {/* ETAPA 2: prévia antes de gravar (o "tratamento" dos dados) */}
      {etapa === 2 && (
        <section className="painel">
          <div className="painel-topo">
            <div>
              <h2>Conferir dados</h2>
              <p><FileUp size={14} /> {arquivo?.name}</p>
            </div>
            <div className="resumo-previa">
              <span className="selo verde">{novas} novas</span>
              <span className="selo">{previa.length - novas} já existem</span>
            </div>
          </div>

          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr><th>Data</th><th>Descrição</th><th>Categoria sugerida</th><th className="direita">Valor</th><th>Situação</th></tr>
              </thead>
              <tbody>
                {previa.map((p, i) => (
                  <tr key={i} className={p.duplicada ? "apagada" : ""}>
                    <td className="num">{dataBR(p.data)}</td>
                    <td>{p.descricao}</td>
                    <td><span className="selo">{p.categoria}</span></td>
                    <td className={`direita num ${p.valor >= 0 ? "positivo" : "negativo"}`}>{dinheiro(p.valor)}</td>
                    <td>{p.duplicada ? <span className="selo">Duplicada</span> : <span className="selo verde">Nova</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="acoes">
            <button className="botao" onClick={importar} disabled={carregando || novas === 0}>
              {carregando && <MiniSpinner />}
              {carregando ? "Importando..." : `Importar ${novas} movimentações`}
            </button>
            <button className="botao claro" onClick={novoArquivo} disabled={carregando}>
              Escolher outro arquivo
            </button>
          </div>
        </section>
      )}

      {/* ETAPA 3: resultado */}
      {etapa === 3 && resultado && (
        <section className="painel vazio">
          <div className="icone-vazio sucesso"><CircleCheck size={32} /></div>
          <h2>Importação concluída</h2>
          <p>
            <b>{resultado.inseridas}</b> movimentações inseridas e{" "}
            <b>{resultado.duplicadas}</b> duplicadas ignoradas.
          </p>
          <div className="acoes centro">
            <button className="botao" onClick={novoArquivo}>Importar novo OFX</button>
            <button className="botao claro" onClick={() => irPara("tratamento")}>Ver contas</button>
            {pode("analise:ler") && (
              <button className="botao claro" onClick={() => irPara("analise")}>Ver análise</button>
            )}
          </div>
        </section>
      )}
    </>
  );
}
