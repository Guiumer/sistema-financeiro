import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on page load
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes (login/logout from any tab or device)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function login(email: string, password: string): Promise<boolean> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : error.message);
      return false;
    }
    const name = data.user?.user_metadata?.name ?? email.split('@')[0];
    toast.success(`Bem-vindo, ${name}!`);
    return true;
  }

  async function register(name: string, email: string, password: string): Promise<boolean> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) {
      toast.error(error.message === 'User already registered'
        ? 'Este e-mail já está cadastrado.'
        : error.message);
      return false;
    }
    if (data.user && !data.session) {
      // Email confirmation required
      toast.success('Conta criada! Verifique seu e-mail para confirmar.');
      return true;
    }
    toast.success(`Conta criada! Bem-vindo, ${name}!`);
    return true;
  }

  async function logout() {
    await supabase.auth.signOut();
    toast.success('Sessão encerrada.');
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
