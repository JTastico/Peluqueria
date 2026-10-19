import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { installAuthFetch } from './lib/api.ts'
import { aplicarTema, temaGuardado } from './lib/theme.ts'
import { aplicarPreferencias, preferenciasGuardadas } from './lib/prefs.ts'

installAuthFetch();
// Antes de pintar: último tema y letra conocidos (evita un parpadeo con los colores por defecto)
aplicarTema(temaGuardado());
aplicarPreferencias(preferenciasGuardadas());

createRoot(document.getElementById("root")!).render(<App />);
