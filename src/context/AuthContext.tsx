import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { User } from '../types/auth';
import { generateSalt, hashPassword, verifyPassword } from '../utils/crypto';
import { generateId } from '../utils/format';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = 'sf_users';
const SESSION_KEY = 'sf_session';

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionId = localStorage.getItem(SESSION_KEY);
    if (sessionId) {
      const users = loadUsers();
      const found = users.find(u => u.id === sessionId);
      if (found) setUser(found);
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string): Promise<boolean> {
    const users = loadUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      toast.error('E-mail não encontrado.');
      return false;
    }
    const valid = await verifyPassword(password, found.salt, found.passwordHash);
    if (!valid) {
      toast.error('Senha incorreta.');
      return false;
    }
    localStorage.setItem(SESSION_KEY, found.id);
    setUser(found);
    toast.success(`Bem-vindo, ${found.name}!`);
    return true;
  }

  async function register(name: string, email: string, password: string): Promise<boolean> {
    const users = loadUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      toast.error('Este e-mail já está cadastrado.');
      return false;
    }
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const newUser: User = {
      id: generateId(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);
    localStorage.setItem(SESSION_KEY, newUser.id);
    setUser(newUser);
    toast.success(`Conta criada! Bem-vindo, ${newUser.name}!`);
    return true;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
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
