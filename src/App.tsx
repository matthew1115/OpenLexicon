import { useState, useEffect } from 'react'
import WelcomePage from './pages/welcome'

import './App.css'

import { Button } from "@/components/ui/button"
import SettingsIcon from "@mui/icons-material/Settings"
import SaveIcon from "@mui/icons-material/Save"
import { SettingsModal } from "./pages/settings"
import { ThemeProvider } from "@/components/theme-provider"
import { getSettings } from "@/utils/settings"

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const s = getSettings();
    return s?.general?.theme || "system";
  });

  useEffect(() => {
    const handleStorage = () => {
      const s = getSettings();
      setTheme(s?.general?.theme || "system");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <ThemeProvider defaultTheme={theme}>
      <WelcomePage />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSettingsChange={s => setTheme(s.general.theme)}
      />
      <div className="fixed bottom-4 left-4 flex flex-col gap-2 z-50">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open settings"
        >
          <SettingsIcon />
        </Button>
        <Button variant="secondary" size="icon">
          <SaveIcon />
        </Button>
      </div>
    </ThemeProvider>
  )
}

export default App
