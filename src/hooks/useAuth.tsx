import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, testSupabaseConnection, getUserProfile, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  isDemo: boolean;
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

// Demo data générée une seule fois
const DEMO_USER: User = {
  id: 'demo-user-id',
  email: 'demo@oxa-groupe.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated'
} as User;

const DEMO_SESSION: Session = {
  access_token: 'demo-token',
  refresh_token: 'demo-refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user: DEMO_USER
} as Session;

const DEMO_PROFILE: Profile = {
  id: 'demo-profile-id',
  user_id: DEMO_USER.id,
  email: DEMO_USER.email!,
  nom: 'Utilisateur',
  prenom: 'Démo',
  role: 'commercial',
  actif: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  // Fonction pour charger le profil utilisateur
  const loadUserProfile = useCallback(async (userId: string) => {
    if (isDemo) {
      setProfile(DEMO_PROFILE);
      return;
    }

    try {
      const profileData = await getUserProfile(userId);
      setProfile(profileData);
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      setProfile(null);
    }
  }, [isDemo]);

  // Fonction pour rafraîchir le profil
  const refreshProfile = useCallback(async () => {
    if (user && !isDemo) {
      await loadUserProfile(user.id);
    }
  }, [user, isDemo, loadUserProfile]);

  // Initialisation de l'authentification
  useEffect(() => {
    let mounted = true;
    let connectionTestTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Vérifier la configuration Supabase
        if (!isSupabaseConfigured()) {
          console.log('Mode démo activé - Supabase non configuré');
          setIsDemo(true);
          setUser(DEMO_USER);
          setSession(DEMO_SESSION);
          setProfile(DEMO_PROFILE);
          return;
        }

        // Test de connexion avec timeout
        const connectionPromise = testSupabaseConnection();
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          connectionTestTimeout = setTimeout(() => reject(new Error('Timeout')), 5000);
        });

        const isConnected = await Promise.race([connectionPromise, timeoutPromise]);
        
        if (!isConnected) {
          throw new Error('Connexion échouée');
        }

        // Récupérer la session actuelle
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!mounted) return;

        setUser(currentSession?.user || null);
        setSession(currentSession);
        setIsDemo(false);

        // Charger le profil si utilisateur connecté
        if (currentSession?.user) {
          await loadUserProfile(currentSession.user.id);
        }

      } catch (error: any) {
        if (!mounted) return;
        
        console.warn('Basculement vers le mode démo:', error.message);
        setIsDemo(true);
        setUser(DEMO_USER);
        setSession(DEMO_SESSION);
        setProfile(DEMO_PROFILE);
        setError(null); // Ne pas afficher d'erreur en mode démo
      } finally {
        if (mounted) {
          setLoading(false);
        }
        if (connectionTestTimeout) {
          clearTimeout(connectionTestTimeout);
        }
      }
    };

    initializeAuth();

    // Écouter les changements d'authentification
    let authSubscription: any = null;
    
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          if (!mounted) return;

          console.log('Auth state changed:', event);
          
          setSession(newSession);
          setUser(newSession?.user || null);
          
          if (newSession?.user && !isDemo) {
            await loadUserProfile(newSession.user.id);
          } else {
            setProfile(null);
          }
        }
      );
      
      authSubscription = subscription;
    }

    return () => {
      mounted = false;
      if (connectionTestTimeout) {
        clearTimeout(connectionTestTimeout);
      }
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [loadUserProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      if (isDemo) {
        // Mode démo - accepter n'importe quels identifiants
        setUser(DEMO_USER);
        setSession(DEMO_SESSION);
        setProfile(DEMO_PROFILE);
        return;
      }

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
  }, [isDemo]);

  const signUp = useCallback(async (email: string, password: string, userData: Partial<Profile>) => {
    try {
      setError(null);
      setLoading(true);

      if (isDemo) {
        // Mode démo - simuler la création
        setUser(DEMO_USER);
        setSession(DEMO_SESSION);
        setProfile({ ...DEMO_PROFILE, ...userData });
        return;
      }

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
  }, [isDemo]);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      
      if (!isDemo) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
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
  }, [isDemo]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    error,
    isDemo,
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