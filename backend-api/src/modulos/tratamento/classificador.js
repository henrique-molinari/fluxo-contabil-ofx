// Categorias disponíveis e classificação automática pela descrição da conta.

export const CATEGORIAS = [
  "Receitas",
  "Aluguel",
  "Energia",
  "Internet",
  "Folha de pagamento",
  "Material de escritório",
  "Equipamentos",
  "Veículo",
  "Assinaturas",
  "Outros",
  "Sem categoria",
];

// Se a descrição tiver a palavra, vai para a categoria (comparação em maiúsculo e sem acento)
const REGRAS = {
  Receitas: ["RECEBIMENTO", "PAGAMENTO CLIENTE", "PIX CLIENTE"],
  Aluguel: ["ALUGUEL"],
  Energia: ["ENERGIA"],
  Internet: ["INTERNET"],
  "Folha de pagamento": ["FOLHA"],
  "Material de escritório": ["MATERIAL"],
  Equipamentos: ["EQUIPAMENTOS"],
  Veículo: ["VEICULO", "ESTACIONAMENTO"],
  Assinaturas: ["ASSINATURA"],
};

// "Veículo" -> "VEICULO": assim a regra não depende de acento nem de maiúscula
export function tirarAcentos(texto) {
  return (texto ?? "").normalize("NFD").replace(/\p{Mn}/gu, "").toUpperCase();
}

// Procura a primeira regra que combina; se nenhuma combina, fica "Sem categoria"
// para o analista classificar na mão depois.
export function classificar(descricao) {
  const texto = tirarAcentos(descricao);
  for (const [categoria, palavras] of Object.entries(REGRAS)) {
    if (palavras.some((p) => texto.includes(p))) return categoria;
  }
  return "Sem categoria";
}
