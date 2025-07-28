import { ModelsProvider } from "./context/model-provider"
import React from "react"
import './index.css'
import ReactDOM from "react-dom/client"
import App from "./App.tsx"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ModelsProvider>
      <App />
    </ModelsProvider>
  </React.StrictMode>
)