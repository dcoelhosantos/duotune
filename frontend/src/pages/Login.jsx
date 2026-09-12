import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return "Formato de e-mail inválido.";
    if (formData.password.trim() === '') return "A senha é obrigatória.";
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

    try {
      // Endpoint presumido para o login
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Credenciais inválidas.');
        return;
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');

    } catch (err) {
      setError('Erro de conexão com o servidor.');
    }
  };

  return (
    <div>
      <h2>Entrar - DuoTune</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="E-mail" 
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required 
        />
        <input 
          type="password" 
          placeholder="Senha" 
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required 
        />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}