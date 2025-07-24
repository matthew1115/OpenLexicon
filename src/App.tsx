import { useState } from 'react'
import WelcomePage from './pages/welcome'

import './App.css'

import { Button } from "@/components/ui/button"
import SettingsIcon from "@mui/icons-material/Settings"
import SaveIcon from "@mui/icons-material/Save"
import { SettingsModal } from "./pages/settings"

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <WelcomePage />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
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
    </>
  )
}

export default App
