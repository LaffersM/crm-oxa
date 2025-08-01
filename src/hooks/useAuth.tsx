import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getUserProfile, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour charger le profil utilisateur
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const profileData = await getUserProfile(userId);
      setProfile(profileData);
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      setProfile(null);
    }
  }, []);

  // Fonction pour rafraîchir le profil
  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  }, [user, loadUserProfile]);

  // Initialisation de l'authentification
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupérer la session actuelle
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Erreur de session:', sessionError);
          setError('Erreur de connexion à la base de données');
          return;
        }

        if (!mounted) return;

        setUser(currentSession?.user || null);
        setSession(currentSession);

        // Charger le profil si utilisateur connecté
        if (currentSession?.user) {
          await loadUserProfile(currentSession.user.id);
        }

      } catch (error: any) {
        if (!mounted) return;
        
        console.error('Erreur initialisation auth:', error);
        setError(error.message || 'Erreur de connexion');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        console.log('Auth state changed:', event);
        
        setSession(newSession);
        setUser(newSession?.user || null);
        
        if (newSession?.user) {
          await loadUserProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        
        setError(null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

    } catch (error: any) {
      console.error('Erreur connexion:', error);
      setError(error.message || 'Erreur de connexion');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, userData: Partial<Profile>) => {
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
        // Créer le profil
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: data.user.id,
              email: data.user.email,
              nom: userData.nom || '',
              prenom: userData.prenom || '',
              role: userData.role || 'commercial',
              actif: true,
            },
          ]);

        if (profileError) {
          console.error('Erreur création profil:', profileError);
          throw new Error('Erreur lors de la création du profil');
        }
      }

    } catch (error: any) {
      console.error('Erreur inscription:', error);
      setError(error.message || 'Erreur lors de l\'inscription');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      // Reset state
      setUser(null);
      setSession(null);
      setProfile(null);
      
    } catch (error: any) {
      console.error('Erreur déconnexion:', error);
      setError(error.message || 'Erreur lors de la déconnexion');
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};