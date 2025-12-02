import { Route, Routes } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Outfits from './pages/Outfits'
import Packing from './pages/Packing'
import PhaseOut from './pages/PhaseOut'
import Settings from './pages/Settings'

export default function App() {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <div className="pattern-dots min-h-screen">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/packing" element={<Packing />} />
                        <Route path="/outfits" element={<Outfits />} />
                        <Route path="/phase-out" element={<PhaseOut />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </div>
            </main>
        </div>
    )
}

