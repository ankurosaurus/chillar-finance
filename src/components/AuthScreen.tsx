import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, KeyRound, ShieldCheck, ArrowRight, Sparkles, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';

export const AuthScreen: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const login = useFinanceStore((s) => s.login);
  const register = useFinanceStore((s) => s.register);
  const users = useFinanceStore((s) => s.users);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim();
    if (!cleanUser) {
      setError('Please enter a username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (isRegister) {
      if (password.length < 4) {
        setError('Password should be at least 4 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      const success = register(cleanUser, password, fullName);
      if (!success) {
        setError('Username already exists. Please choose another or sign in.');
        return;
      }
    } else {
      const success = login(cleanUser, password);
      if (!success) {
        setError('Invalid username or password. If you are new, tap Create Account.');
        return;
      }
    }
  };

  // Quick helper to sign in with demo credentials if no accounts exist yet
  const handleQuickDemo = () => {
    const demoUser = 'hosteler';
    const demoPass = 'chillar123';
    const found = users.find((u) => u.username.toLowerCase() === demoUser);
    if (!found) {
      register(demoUser, demoPass, 'Hostel Scholar');
    } else {
      login(demoUser, demoPass);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070E] text-white flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden select-none">
      {/* Background luxury gradient glow in electric blue */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0B0F19] border border-blue-500/30 shadow-lg shadow-blue-500/10 mb-4">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-xs font-bold text-white shadow-inner">
              ₹
            </div>
          </div>
          <h1 className="text-3xl font-light tracking-wide font-serif text-white flex items-center justify-center gap-2">
            Chillar
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-400 inline-block" />
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mt-1.5 font-medium">
            Every rupee, accounted for.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#0B0F19]/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative">
          {/* Tabs */}
          <div className="flex bg-[#05070E] p-1 rounded-2xl border border-white/5 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 ${
                !isRegister
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 ${
                isRegister
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Account
            </button>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ankur Sharma"
                    className="w-full bg-[#05070E] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-[#05070E] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#05070E] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#05070E] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span>{isRegister ? 'Create Your Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 transition-colors font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Quick Explore (Hostel Student Demo)
            </button>
          </div>
        </div>

        {/* Security / Offline notice */}
        <div className="mt-6 text-center flex items-center justify-center gap-2 text-slate-400 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Local offline encrypted authentication & storage</span>
        </div>
      </motion.div>
    </div>
  );
};
