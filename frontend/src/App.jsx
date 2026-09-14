import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import { PrivateRoute } from './routes/PrivateRoute';

// Exemplo de componente para a Home autenticada
const Home = () => <h1>DuoTune - Home (Privada)</h1>;

function App() {
  return (
    <Router>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rotas Privadas */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Home />} />
          {/* Adicionar futuras rotas privadas aqui (ex: /search, /fusion) */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;