// main.jsx
// Ponto de entrada: pega o componente App e desenha dentro da div "root".
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
