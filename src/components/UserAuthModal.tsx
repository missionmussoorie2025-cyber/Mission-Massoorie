import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, User, LogIn, LogOut, ShieldCheck, Mail, Lock, Sparkles, 
  Check, Globe, RefreshCw, Smartphone, Key
} from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  FirebaseUser 
} from '../utils/firebase';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  onLoginSuccess?: () => void;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onLoginSuccess?.();
      onClose();
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setAuthError(null);
    try {
      if (authMode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess?.();
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        setAuthError('Invalid credentials. If you are new, click "Create Account".');
      } else if (err?.code === 'auth/email-already-in-use') {
        setAuthError('An account with this email already exists. Try signing in.');
      } else if (err?.code === 'auth/weak-password') {
        setAuthError('Password should be at least 6 characters long.');
      } else {
        setAuthError(err?.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      onClose();
    } catch (err: any) {
      setAuthError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 flex min-h-full items-start sm:items-center justify-center animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111C2D] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative my-6 sm:my-auto max-h-[88vh] overflow-y-auto cursor-default z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#172A46] via-[#C8873D] to-[#2563EB] rounded-t-2xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full text-[#64748B] hover:text-[#0F172A] dark:hover:text-white bg-[#F1F5F9] dark:bg-[#1E293B] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] transition-colors shadow-xs cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 pr-8 pt-1">
          <div className="w-11 h-11 rounded-xl bg-[#172A46] text-[#F59E0B] flex items-center justify-center shrink-0 shadow-sm">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              {currentUser ? 'Personal Cloud Account' : 'Sign In to Your Account'}
            </h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              {currentUser
                ? 'Your study logs and syllabus progress sync live across all devices.'
                : 'Log in on any phone or laptop to automatically load all your data.'}
            </p>
          </div>
        </div>

        {/* If Logged In View */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1320] border border-[#E2E8F0] dark:border-[#1E293B] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold uppercase text-sm shrink-0">
                {currentUser.email ? currentUser.email[0] : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                  {currentUser.displayName || currentUser.email || 'Aspirant User'}
                </div>
                <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">
                  {currentUser.email || `UID: ${currentUser.uid}`}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Cloud Database Active & Synced</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" /> Live Cross-Device Sync Status
              </div>
              <p className="text-[11px] leading-relaxed">
                All topic checks, revision counters, custom notes, and mock scores are saved to your personal Cloud Firestore document and updated live on every connected screen.
              </p>
            </div>

            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#B94A48] hover:bg-[#A33937] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" /> Sign Out of Account
            </button>
          </div>
        ) : (
          /* Sign In / Sign Up Forms */
          <div className="space-y-4">
            {/* Google 1-Click Login Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white dark:bg-[#162131] border border-[#CBD5E1] dark:border-[#334155] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] text-xs font-bold rounded-xl flex items-center justify-center gap-3 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google Account</span>
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="h-px bg-[#E2E8F0] dark:bg-[#1E293B] flex-1" />
              <span className="text-[11px] font-bold text-[#94A3B8] uppercase">OR EMAIL LOGIN</span>
              <div className="h-px bg-[#E2E8F0] dark:bg-[#1E293B] flex-1" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aspirant@missionmussoorie.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B1320] text-[#0F172A] dark:text-[#F8FAFC]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B1320] text-[#0F172A] dark:text-[#F8FAFC]"
                  />
                </div>
              </div>

              {authError && (
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#172A46] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Authenticating...' : authMode === 'signin' ? 'Sign In to Account' : 'Create New Account'}</span>
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
              >
                {authMode === 'signin'
                  ? "Don't have an account yet? Create one"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
