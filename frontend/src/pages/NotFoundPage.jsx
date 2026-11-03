import React from 'react';
import { Link } from 'react-router-dom';
import { AppButton } from '../components/common/AppButton';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
        <Compass className="w-10 h-10 animate-spin-slow" />
      </div>

      <h1 className="text-6xl font-black text-white tracking-tight mb-2">404</h1>
      <h2 className="text-xl font-bold text-slate-200 mb-3">Page Not Found</h2>
      <p className="text-sm text-slate-400 max-w-md mb-8">
        The page you are looking for doesn't exist, has been removed, or you may not have authorization to view it.
      </p>

      <Link to="/dashboard">
        <AppButton variant="primary" size="lg">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Dashboard
        </AppButton>
      </Link>
    </div>
  );
};

