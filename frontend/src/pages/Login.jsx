import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return "Formato de e-mail inválido.";
    if (formData.password.trim() === "") return "A senha é obrigatória.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Credenciais inválidas.");
        return;
      }

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Coluna da Esquerda (Marca) - Oculta em celulares */}
      <div className="hidden lg:flex lg:w-1/2 bg-purple-950 flex-col justify-center items-center p-12 text-center">
        <h1 className="text-5xl font-bold text-white mb-4">DuoTune</h1>
        <h2 className="text-3xl font-semibold text-fuchsia-400 mb-6">
          Música é melhor em dupla.
        </h2>
        <p className="text-purple-200 text-lg max-w-md">
          Conecte-se, compartilhe, descubra e viva a música de um jeito único
          com quem você ama.
        </p>
      </div>

      {/* Coluna da Direita (Formulário) */}
      <div className="w-full lg:w-1/2 bg-gray-950 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <h2 className="text-3xl font-bold text-white mb-2">Entrar</h2>
          <p className="text-gray-400 mb-8">Bem-vindo de volta! &lt;3</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                E-mail do usuário
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="w-full p-3 bg-gray-900 rounded border border-gray-800 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Senha</label>
              <input
                type="password"
                placeholder="Digite sua senha"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="w-full p-3 bg-gray-900 rounded border border-gray-800 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-white transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full p-3 mt-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-8 text-sm">
            Não tem uma conta?{" "}
            <Link
              to="/cadastrar"
              className="text-fuchsia-400 hover:text-fuchsia-300"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
