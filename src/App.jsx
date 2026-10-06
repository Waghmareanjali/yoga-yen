import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import { useSettingsStore } from './store/settingsStore';

function App() {
  const setTheme = useSettingsStore((state) => state.setTheme);

  useEffect(() => {
    const savedTheme = localStorage.getItem('yoga-yen-theme') || 'light';
    setTheme(savedTheme);
  }, [setTheme]);

  return <AppRoutes />;
}

export default App;
