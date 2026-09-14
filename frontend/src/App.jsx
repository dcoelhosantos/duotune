import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import { PrivateRoute } from "./routes/PrivateRoute";
import MainLayout from "./components/MainLayout";

function App() {
  return (
    <Router>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rotas Privadas */}
        <Route element={<PrivateRoute />}>
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
