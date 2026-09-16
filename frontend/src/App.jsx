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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Rotas Privadas */}
        <Route element={<PrivateRoute />}>
          <Route path="/convidar" element={<GenerateInvite />} />
          <Route path="/aceitar/:code?" element={<AcceptInvite />} />

          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            {/* Adicionar futuras rotas privadas aqui (ex: /search, /fusion) */}
          </Route>
        </Route>

        {/* Fallback (se o usuário digitar uma URL que não existe, joga para a Home) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
