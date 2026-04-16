import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});
const AUTH_FALLBACK_TIMEOUT_MS = 15000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*, tenant:tenants(*)')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
    return data;
  }

  useEffect(() => {
    let isMounted = true;

    async function syncAuthState(session) {
      if (!isMounted) {
        return;
      }

      if (session?.user) {
        setUser(session.user);

        try {
          const prof = await fetchProfile(session.user.id);
          if (isMounted) {
            setProfile(prof);
          }
        } catch (error) {
          console.error('Erro ao sincronizar perfil do usuário:', error);
          if (isMounted) {
            setProfile(null);
          }
        }
      } else {
        setUser(null);
        setProfile(null);
      }

      if (isMounted) {
        initializedRef.current = true;
        setLoading(false);
      }
    }

    // Fonte única de verdade: onAuthStateChange dispara INITIAL_SESSION no subscribe
    // (comportamento oficial do Supabase JS v2). Sem race contra timeout artificial.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          await syncAuthState(session);
        } catch (error) {
          console.error(`Erro ao processar evento de autenticação (${event}):`, error);
          if (isMounted) {
            initializedRef.current = true;
            setLoading(false);
          }
        }
      }
    );

    // Fallback de segurança: se INITIAL_SESSION não disparar, libera a UI
    // sem sessão após 15s para não travar em tela de loading indefinidamente.
    const fallbackTimer = window.setTimeout(() => {
      if (isMounted && !initializedRef.current) {
        console.warn('INITIAL_SESSION não disparou em 15s — liberando loading sem sessão.');
        setLoading(false);
      }
    }, AUTH_FALLBACK_TIMEOUT_MS);

    return () => {
      isMounted = false;
      window.clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    // Tenta encerrar a sessão no servidor, mas garante limpeza local mesmo se falhar.
    // Sem isso, erros de rede/token expirado fazem o botão "não funcionar".
    let serverError = null;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) serverError = error;
    } catch (err) {
      serverError = err;
    }

    // Fallback: limpa estado React e storage do Supabase manualmente
    setUser(null);
    setProfile(null);

    try {
      const storageKeys = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          storageKeys.push(key);
        }
      }
      storageKeys.forEach((key) => window.localStorage.removeItem(key));
    } catch (err) {
      console.warn('Falha ao limpar storage local de auth:', err);
    }

    if (serverError) {
      console.warn('signOut do Supabase falhou, mas sessão local foi limpa:', serverError);
    }
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  const isSuperAdmin = profile?.role === 'superadmin';
  const isTenantAdmin = profile?.role === 'tenant_admin';
  const isTenantUser = profile?.role === 'tenant_user';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        isSuperAdmin,
        isTenantAdmin,
        isTenantUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
