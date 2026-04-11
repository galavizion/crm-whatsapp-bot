'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export function RefreshButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setLastUpdate(new Date());
    
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const timeAgo = () => {
    const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    if (seconds < 60) return `hace ${seconds} seg`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `hace ${hours} hr`;
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-blue-500 bg-linear-to-r from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:scale-100"
      >
        <RefreshCw 
          className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
        />
        {isRefreshing ? 'Actualizando...' : 'Actualizar ahora'}
      </button>
      
      <span className="text-xs text-neutral-500 sm:text-sm">
        Última actualización: {timeAgo()}
      </span>
    </div>
  );
}