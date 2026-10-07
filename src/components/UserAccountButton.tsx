import React, { useState } from 'react';
import { User, Cloud, CloudCheck, ShieldCheck, LogIn } from 'lucide-react';
import { FirebaseUser } from '../utils/firebase';
import { UserAuthModal } from './UserAuthModal';

interface UserAccountButtonProps {
  currentUser: FirebaseUser | null;
  isSyncing: boolean;
  lastSyncTime: string | null;
}

export const UserAccountButton: React.FC<UserAccountButtonProps> = ({
  currentUser,
  isSyncing,
  lastSyncTime
}) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsAuthModalOpen(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs border transition-all cursor-pointer ${
          currentUser
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100'
            : 'bg-[#172A46] hover:bg-[#1E3A5F] text-white border-[#C8873D]/40'
        }`}
        title={
          currentUser
            ? `Signed in as ${currentUser.email || 'User'}. Click to manage account.`
            : 'Sign in to access your personal account and sync live across all devices.'
        }
      >
        {currentUser ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline font-bold">
              {currentUser.email ? currentUser.email.split('@')[0] : 'Account Synced'}
            </span>
            <span className="sm:hidden font-bold">Account</span>
          </>
        ) : (
          <>
            <LogIn className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="hidden sm:inline">Sign In / Sync</span>
            <span className="sm:hidden">Sign In</span>
          </>
        )}
      </button>

      <UserAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
      />
    </>
  );
};
