import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import MainLayout from "./components/MainLayout";
import AcceptInvite from "./pages/AcceptInvite.jsx";
import GenerateInvite from "./pages/GenerateInvite.jsx";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { PrivateRoute } from "./routes/PrivateRoute";
import { PublicRoute } from "./routes/PublicRoute.jsx";

function App() {
  return (
    <Router>
      <Routes>
        {/* Rotas Públicas */}
        <Route element={<PublicRoute />}>
          <Route path="/entrar" element={<Login />} />
          <Route path="/cadastrar" element={<Register />} />
        </Route>

        {/* Rotas Privadas */}
        <Route element={<PrivateRoute />}>
          {/* Telas em tela cheia (Sem Sidebar/Topbar) */}
          <Route path="/convidar" element={<GenerateInvite />} />
          <Route path="/aceitar/:code?" element={<AcceptInvite />} />

          {/* Telas com o layout padrão do app */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/generate-invite" element={<GenerateInvite />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            {/* Adicionar futuras rotas privadas aqui (ex: /search, /fusion) */}
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
