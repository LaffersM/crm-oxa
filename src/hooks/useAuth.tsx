import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const initAuth = async (): Promise<{ user: User | null; session: Session | null; error: string | null }> => {
  try {
    // Test connection with a simple query first
    const { error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single();
    
    if (connectionError && connectionError.code === 'PGRST301') {
      // This is expected when no data exists, connection is working
    } else if (connectionError && connectionError.message.includes('timeout')) {
      throw new Error('Connection timeout - Vérifiez votre configuration Supabase et votre connexion internet');
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return { user: null, session: null, error: sessionError.message };
    }

    return { 
      user: session?.user || null, 
      session, 
      error: null 
    };
  } catch (error: any) {
    console.error('Auth initialization error:', error);
    return { 
      user: null, 
      session: null, 
      error: error.message || 'Erreur de connexion Supabase' 
    };
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { user: authUser, session: authSession, error: authError } = await initAuth();
        
        if (!mounted) return;
        
        if (authError) {
          setError(authError);
          setUser(null);
          setSession(null);
        } else {
          setUser(authUser);
          setSession(authSession);
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error('Auth initialization failed:', err);
        setError(err.message || 'Erreur de connexion');
        setUser(null);
        setSession(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user || null);
        setError(null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // The auth state change listener will handle setting user/session
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'Erreur de connexion');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setError(null);
      setLoading(true);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: data.user.id,
              email: data.user.email,
              nom: userData.nom,
              prenom: userData.prenom,
              role: userData.role || 'commercial',
            },
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error('Erreur lors de la création du profil');
        }
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message || 'Erreur lors de l\'inscription');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError(error.message || 'Erreur lors de la déconnexion');
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};