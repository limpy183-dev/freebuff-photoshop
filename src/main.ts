import { AppShell } from './ui/app-shell';
import './styles/main.css';

declare global {
  interface Window {
    __appShell?: AppShell;
  }
}

function init(): void {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    console.error('App container not found');
    return;
  }

  const shell = new AppShell(appContainer);
  window.__appShell = shell;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
