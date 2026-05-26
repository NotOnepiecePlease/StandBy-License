import { useRef, useState, useEffect } from 'react'

interface Props {
	onLogin: (key: string) => void
}

export function LoginPage({ onLogin }: Props) {
	const [key, setKey] = useState('')
	const [show, setShow] = useState(false)
	const [remember, setRemember] = useState(true)
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		inputRef.current?.focus()
	}, [])

	const submit = (e?: React.FormEvent) => {
		e?.preventDefault()
		const v = key.trim()
		if (!v) { setError('Informe a chave de administrador.'); return }
		if (v.length < 8) { setError('Chave inválida — mínimo 8 caracteres.'); return }
		setError('')
		setLoading(true)
		setTimeout(() => onLogin(v), 700)
	}

	return (
		<div className="adm-login-stage">
			{/* Left visual */}
			<div className="adm-login-visual">
				<div className="adm-login-brand">
					<div className="brand-mark">SB</div>
					<div className="meta">
						<div className="name">Stand By</div>
						<div className="tag">Admin Console</div>
					</div>
				</div>

				<div className="adm-login-headline">
					<div className="adm-login-eyebrow">
						<span className="pulse" />
						Acesso Restrito
					</div>
					<h1 className="adm-login-title">
						Gerencie <em>licenças</em>, máquinas e clientes em um único lugar.
					</h1>
					<p className="adm-login-sub">
						Renove planos, revogue acessos comprometidos e desvincule máquinas em segundos. Tudo auditado, tudo criptografado.
					</p>
				</div>

				<div className="adm-login-stats">
					<div className="adm-login-stat">
						<div className="l">Licenças ativas</div>
						<div className="v">847</div>
					</div>
					<div className="adm-login-stat">
						<div className="l">Renovadas / 30d</div>
						<div className="v">214<span className="sub">+12%</span></div>
					</div>
					<div className="adm-login-stat">
						<div className="l">Uptime</div>
						<div className="v">99.97<span className="sub">%</span></div>
					</div>
				</div>
			</div>

			{/* Right form */}
			<div className="adm-login-form">
				<div className="adm-login-card">
					<h2 className="adm-login-card-title">Entrar no painel</h2>
					<p className="adm-login-card-sub">
						Digite sua{' '}
						<strong style={{ color: 'var(--text-1)', fontFamily: 'var(--f-mono)' }}>X-Admin-Key</strong>{' '}
						para continuar. A chave fica salva localmente neste dispositivo.
					</p>

					<form onSubmit={submit} noValidate>
						<div className="adm-field">
							<label className="adm-field-label">
								<span>X-Admin-Key</span>
								<span className="hint">requerido</span>
							</label>
							<div className={`adm-input-wrap ${error ? 'error' : ''}`}>
								<span className="icon-prefix">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
										<circle cx="9" cy="14" r="4" />
										<path d="M12 14L21 5" />
										<path d="M18 8l3 3" />
										<path d="M15 11l2 2" />
									</svg>
								</span>
								<input
									ref={inputRef}
									type={show ? 'text' : 'password'}
									value={key}
									onChange={(e) => { setKey(e.target.value); if (error) setError('') }}
									placeholder="••••••••••••••••"
									autoComplete="off"
									spellCheck={false}
								/>
								<button type="button" className="adm-toggle-eye" onClick={() => setShow((s) => !s)}>
									{show ? (
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
											<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
											<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
											<line x1="1" y1="1" x2="23" y2="23" />
										</svg>
									) : (
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
											<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
											<circle cx="12" cy="12" r="3" />
										</svg>
									)}
								</button>
							</div>
							{error && (
								<div className="adm-error-msg">
									<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
										<circle cx="12" cy="12" r="10" />
										<line x1="12" y1="8" x2="12" y2="12" />
										<line x1="12" y1="16" x2="12.01" y2="16" />
									</svg>
									{error}
								</div>
							)}
						</div>

						<div className={`adm-remember ${remember ? 'checked' : ''}`} onClick={() => setRemember((r) => !r)}>
							<div className="checkbox">
								<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
									<polyline points="20 6 9 17 4 12" />
								</svg>
							</div>
							<div>
								Manter sessão neste dispositivo
								<div style={{ fontFamily: 'var(--f-mono)', fontSize: 10.5, color: 'var(--text-3)', marginTop: 3, letterSpacing: '0.04em' }}>
									Armazenado em localStorage
								</div>
							</div>
						</div>

						<button type="submit" className={`adm-btn-primary ${loading ? 'loading' : ''}`} disabled={loading || !key.trim()}>
							{loading ? (
								<>
									<div className="spinner" />
									Validando…
								</>
							) : (
								<>
									Acessar painel
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
										<line x1="5" y1="12" x2="19" y2="12" />
										<polyline points="12 5 19 12 12 19" />
									</svg>
								</>
							)}
						</button>
					</form>

					<div className="adm-login-foot">
						<div className="secure">
							<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
								<rect x="3" y="11" width="18" height="11" rx="2" />
								<path d="M7 11V7a5 5 0 0 1 10 0v4" />
							</svg>
							Conexão Segura
						</div>
						<div>v 1.0.0</div>
					</div>
				</div>
			</div>
		</div>
	)
}
