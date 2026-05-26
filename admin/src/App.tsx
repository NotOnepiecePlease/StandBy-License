import { useState } from 'react'
import './index.css'
import './admin.css'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'

export default function App() {
	const [adminKey, setAdminKey] = useState<string | null>(() => {
		try { return localStorage.getItem('sb_admin_key') } catch { return null }
	})

	const handleLogin = (key: string) => {
		try { localStorage.setItem('sb_admin_key', key) } catch {}
		setAdminKey(key)
	}

	const handleLogout = () => {
		try { localStorage.removeItem('sb_admin_key') } catch {}
		setAdminKey(null)
	}

	if (!adminKey) return <LoginPage onLogin={handleLogin} />
	return <DashboardPage adminKey={adminKey} onLogout={handleLogout} />
}
