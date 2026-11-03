import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
  reload,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User,
} from '../services/firebase';

export interface CustomerProfile {
  fullName: string;
  email: string;
  address?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthAvailable: boolean;
  isEmailVerified: boolean;
  userEmail: string | null;
  displayName: string | null;
  profile: CustomerProfile | null;
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<User>;
  register: (email: string, pass: string, fullName: string, address?: string) => Promise<User>;
  logout: () => Promise<void>;
  sendVerification: () => Promise<void>;
  reloadUser: () => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
  verifyResetCode: (code: string) => Promise<string>;
  confirmReset: (code: string, newPass: string) => Promise<void>;
  applyVerifyCode: (code: string) => Promise<void>;
  updateProfileData: (data: Partial<CustomerProfile>) => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_STORAGE_PREFIX = 'mnh_profile_';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Refresh context consumers after Firebase mutates User metadata in place.
  const [authRevision, setAuthRevision] = useState(0);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  const isAuthAvailable = Boolean(auth);

  // Load local profile metadata when user changes
  const loadProfile = (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    try {
      const stored = localStorage.getItem(`${PROFILE_STORAGE_PREFIX}${currentUser.uid}`);
      if (stored) {
        setProfile(JSON.parse(stored));
      } else {
        setProfile({
          fullName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Khách hàng',
          email: currentUser.email || '',
        });
      }
    } catch {
      setProfile({
        fullName: currentUser.displayName || 'Khách hàng',
        email: currentUser.email || '',
      });
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      loadProfile(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (emailInput: string, pass: string, rememberMe = true): Promise<User> => {
    if (!auth) {
      throw new Error('Dịch vụ xác thực hiện chưa khả dụng trên máy chủ.');
    }
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const cred = await signInWithEmailAndPassword(auth, emailInput.trim(), pass);
    setUser(cred.user);
    loadProfile(cred.user);
    return cred.user;
  };

  const register = async (emailInput: string, pass: string, fullName: string, address?: string): Promise<User> => {
    if (!auth) {
      throw new Error('Dịch vụ tạo tài khoản hiện chưa khả dụng trên máy chủ.');
    }
    const cred = await createUserWithEmailAndPassword(auth, emailInput.trim(), pass);
    if (fullName.trim()) {
      await updateProfile(cred.user, { displayName: fullName.trim() });
    }

    const newProfile: CustomerProfile = {
      fullName: fullName.trim(),
      email: cred.user.email || emailInput.trim(),
      address: address?.trim() || '',
    };
    try {
      localStorage.setItem(`${PROFILE_STORAGE_PREFIX}${cred.user.uid}`, JSON.stringify(newProfile));
    } catch {}
    setProfile(newProfile);
    setUser(cred.user);

    // Send brand-aligned welcome email asynchronously without blocking registration completion
    // Uses keepalive: true so client-side navigation does not abort the in-flight request
    (async () => {
      try {
        const idToken = await cred.user.getIdToken();
        const res = await fetch('/api/auth/send-welcome-email', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fullName: fullName.trim() }),
          keepalive: true,
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.warn('[MNH Auth] Welcome email API response status:', res.status, errData?.error);
        }
      } catch (err) {
        // Email delivery failure must never invalidate the newly created account
        console.warn('[MNH Auth] Welcome email dispatch failed in background:', err);
      }
    })();

    return cred.user;
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setUser(null);
    setProfile(null);
  };

  const sendVerification = async () => {
    if (!auth || !auth.currentUser) {
      throw new Error('Không tìm thấy phiên đăng nhập để gửi email xác thực.');
    }

    // 1. Try sending premium branded verification email via Resend
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        return;
      }
      console.warn('[MNH Auth] Custom verification API non-success, using Firebase fallback:', data?.error);
    } catch (err) {
      console.warn('[MNH Auth] Custom verification fetch error, using Firebase fallback:', err);
    }

    // 2. Safe fallback to default Firebase Auth email
    await sendEmailVerification(auth.currentUser);
  };

  const reloadUser = async () => {
    if (!auth || !auth.currentUser) return;
    await reload(auth.currentUser);
    // Keep the genuine Firebase User instance (with prototype methods like getIdToken).
    setUser(auth.currentUser);
    setAuthRevision((revision) => revision + 1);
  };

  const sendResetEmail = async (emailInput: string) => {
    if (!auth) {
      throw new Error('Dịch vụ đặt lại mật khẩu chưa khả dụng.');
    }
    const cleanEmail = emailInput.trim();

    // 1. Try sending premium branded password reset email via Resend
    try {
      const res = await fetch('/api/auth/send-reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        return;
      }
      console.warn('[MNH Auth] Custom reset password API non-success, using Firebase fallback:', data?.error);
    } catch (err) {
      console.warn('[MNH Auth] Custom reset password fetch error, using Firebase fallback:', err);
    }

    // 2. Safe fallback to default Firebase Auth email
    await sendPasswordResetEmail(auth, cleanEmail);
  };

  const verifyResetCode = async (code: string): Promise<string> => {
    if (!auth) {
      throw new Error('Dịch vụ xác thực mã chưa khả dụng.');
    }
    return await verifyPasswordResetCode(auth, code);
  };

  const confirmReset = async (code: string, newPass: string) => {
    if (!auth) {
      throw new Error('Dịch vụ đặt lại mật khẩu chưa khả dụng.');
    }
    await confirmPasswordReset(auth, code, newPass);
  };

  const applyVerifyCode = async (code: string) => {
    if (!auth) {
      throw new Error('Dịch vụ xác thực mã chưa khả dụng.');
    }
    await applyActionCode(auth, code);
    if (auth.currentUser) {
      await reload(auth.currentUser);
      // Object-spreading Firebase User drops prototype methods and breaks order history tokens.
      setUser(auth.currentUser);
      setAuthRevision((revision) => revision + 1);
    }
  };

  const updateProfileData = async (data: Partial<CustomerProfile>) => {
    if (!user) return;
    const updated: CustomerProfile = {
      fullName: data.fullName ?? profile?.fullName ?? user.displayName ?? 'Khách hàng',
      email: user.email || '',
      address: data.address ?? profile?.address ?? '',
      phone: data.phone ?? profile?.phone ?? '',
    };
    if (data.fullName && user) {
      await updateProfile(user, { displayName: data.fullName });
    }
    try {
      localStorage.setItem(`${PROFILE_STORAGE_PREFIX}${user.uid}`, JSON.stringify(updated));
    } catch {}
    setProfile(updated);
  };

  const getIdToken = async (forceRefresh = false): Promise<string | null> => {
    const currentUser = auth?.currentUser;
    if (!currentUser) return null;
    try {
      return await currentUser.getIdToken(forceRefresh);
    } catch (error: any) {
      console.warn('[MNH Auth] Failed to obtain Firebase ID token:', error?.code || 'unknown');
      return null;
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthAvailable,
      isEmailVerified: Boolean(user?.emailVerified),
      userEmail: user?.email || null,
      displayName: user?.displayName || profile?.fullName || null,
      profile,
      login,
      register,
      logout,
      sendVerification,
      reloadUser,
      sendResetEmail,
      verifyResetCode,
      confirmReset,
      applyVerifyCode,
      updateProfileData,
      getIdToken,
    }),
    [user, loading, isAuthAvailable, profile, authRevision]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
