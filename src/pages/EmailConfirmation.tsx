import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '@/assets/logo.png';

export default function EmailConfirmation() {
  const location = useLocation();
  const email = location.state?.email || 'your email';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 max-w-md w-full text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-[40px]">mark_email_unread</span>
        </div>
        
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Check your email</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          We've sent a confirmation link to <span className="font-bold text-slate-700 dark:text-slate-300">{email}</span>. 
          Please click the link to verify your account and start investing.
        </p>
        
        <div className="space-y-4">
          <Link to="/login" className="block w-full py-4 bg-primary text-white rounded-2xl font-bold hover:opacity-90 active:scale-[0.98] transition-all">
            Return to Login
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Didn't receive the email? Check your spam folder.
          </p>
        </div>
      </div>
    </div>
  );
}
