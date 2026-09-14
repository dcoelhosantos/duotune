import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.name.length < 2 || formData.name.length > 100)
      return "O nome deve ter entre 2 e 100 caracteres.";
    if (!emailRegex.test(formData.email)) return "Formato de e-mail inválido.";
    if (formData.password.length < 8)
      return "A senha deve ter no mínimo 8 caracteres.";
    if (formData.password !== formData.confirmPassword)
      return "As senhas não coincidem.";
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
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Erro ao realizar cadastro.");
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
      {/* Coluna da Esquerda (Marca) */}
      <div className="hidden lg:flex lg:w-1/2 bg-purple-950 flex-col justify-center items-center p-12 text-center">
        <h1 className="text-5xl font-bold text-white mb-4">DuoTune</h1>
        <h2 className="text-3xl font-semibold text-fuchsia-400 mb-6">
          Música é melhor em dupla.
        </h2>
        <p className="text-purple-200 text-lg max-w-md">
          Crie sua conta e comece a compartilhar sua trilha sonora.
        </p>
      </div>

      {/* Coluna da Direita (Formulário) */}
      <div className="w-full lg:w-1/2 bg-gray-950 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <h2 className="text-3xl font-bold text-white mb-2">Criar Conta</h2>
          <p className="text-gray-400 mb-8">Junte-se ao DuoTune</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Nome completo
              </label>
              <input
                type="text"
                placeholder="Ex: Joadson Ferreira"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full p-3 bg-gray-900 rounded border border-gray-800 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">E-mail</label>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  placeholder="Mín. 8 caract."
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className="w-full p-3 bg-gray-900 rounded border border-gray-800 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  placeholder="Repita a senha"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  className="w-full p-3 bg-gray-900 rounded border border-gray-800 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full p-3 mt-6 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Cadastrando..." : "Criar conta"}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-8 text-sm">
            Já tem uma conta?{" "}
            <Link
              to="/login"
              className="text-fuchsia-400 hover:text-fuchsia-300"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
