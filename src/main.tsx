import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import './styles.css';
import { queryClient, restoreCache } from './lib/query';
import { router } from './router';
import { applyTheme } from './lib/theme';
import { startPwa } from './lib/pwa';

// iOS only shows :active styles when a touchstart listener exists up the tree.
document.addEventListener('touchstart', () => {}, { passive: true });
document.documentElement.classList.toggle('standalone', matchMedia('(display-mode: standalone)').matches);

applyTheme();
startPwa();

// Ask the browser not to evict our offline cache (granted automatically to installed apps).
navigator.storage?.persist?.().catch(() => {});

restoreCache().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
});
