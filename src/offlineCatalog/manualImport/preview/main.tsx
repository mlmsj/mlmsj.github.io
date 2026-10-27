import { createRoot } from 'react-dom/client';

// DEV is a preview gate, never authentication. This HTML is not a production entry.
if (import.meta.env.DEV) {
  const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  if (localHost) {
    void import('../ImportWorkspace').then(({ ImportWorkspace }) => {
      const host = document.getElementById('import-preview');
      if (host) createRoot(host).render(<ImportWorkspace />);
    });
  }
}
