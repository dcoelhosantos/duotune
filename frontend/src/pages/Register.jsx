import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div>
      <h2>Criar Conta - DuoTune</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nome (ex: Lucas Silva)"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="E-mail"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
        />
        <input
          type="password"
          placeholder="Confirmar Senha"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          required
        />
        {/* Botão travado durante o loading */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>
    </div>
  );
}
