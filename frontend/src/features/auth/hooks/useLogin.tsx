import { useState } from 'react';
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (credentials: { email: string; password: string; remember?: boolean }) => {
    setLoading(true);
    
    try {
      const result = await login(credentials);
      
      if (result.success) {
        // Redirect to dashboard or intended page
        const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
        navigate(redirectTo);
      }
      
      return result;
    } finally {
      setLoading(false);
    }
  };

  return {
    handleLogin,
    loading,
  };
};
