'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AutoRefreshOnFocus() {
  const router = useRouter();

  useEffect(() => {
    const handleFocus = () => {
      console.log('👁️ Usuario regresó a la pestaña - Actualizando datos...');
      router.refresh();
    };

    // Se activa cuando el usuario regresa a la pestaña
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, [router]);

  // Este componente no renderiza nada visible
  return null;
}