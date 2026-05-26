import { useState, useMemo, useEffect, useCallback } from 'react'
import { type Licenca, type LicencaStatus, getStatus, listar, criar, renovar, revogar, desvincular } from '../services/licencas'
import { gradientFor, initialsOf, formatDateBR, relativeExpiry } from '../utils/format'

interface Props {
	adminKey: string
	onLogout: () => void
}

type ModalState =
	| { kind: 'renew'; license: Licenca; months: number }
	| { kind: 'revoke'; license: Licenca }
	| { kind: 'unbind'; license: Licenca }
	| { kind: 'new' }

interface Toast {
	id: number
	msg: string
	kind: 'success' | 'danger' | 'purple'
}

export function DashboardPage({ adminKey, onLogout }: Props) {
	const [licenses, setLicenses] = useState<Licenca[]>([])
	const [loading, setLoading] = useState(true)
	const [filter, setFilter] = useState<'todas' | LicencaStatus>('todas')
	const [query, setQuery] = useState('')
	const [modal, setModal] = useState<ModalState | null>(null)
	const [toast, setToast] = useState<Toast | null>(null)

	const showToast = useCallback((msg: string, kind: Toast['kind'] = 'success') => {
		setToast({ msg, kind, id: Date.now() })
	}, [])

	useEffect(() => {
		if (!toast) return
		const t = setTimeout(() => setToast(null), 3000)
		return () => clearTimeout(t)
	}, [toast])

	const fetchLicenses = useCallback(async () => {
		try {
			const data = await listar(adminKey)
			setLicenses(data)
		} catch (e: unknown) {
			if (e instanceof Error && e.message === 'unauthorized') {
				onLogout()
			} else {
				showToast('Erro ao carregar licenças.', 'danger')
			}
		} finally {
			setLoading(false)
		}
	}, [adminKey, onLogout, showToast])

	useEffect(() => { fetchLicenses() }, [fetchLicenses])

	const counts = useMemo(() => {
		const c = { total: licenses.length, ativa: 0, expirada: 0, revogada: 0 }
		licenses.forEach((l) => { c[getStatus(l)]++ })
		return c
	}, [licenses])

	const filtered = useMemo(() => {
		let list = licenses
		if (filter !== 'todas') list = list.filter((l) => getStatus(l) === filter)
		const q = query.trim().toLowerCase()
		if (q) {
			list = list.filter(
				(l) =>
					l.chave.toLowerCase().includes(q) ||
					l.clienteNome.toLowerCase().includes(q) ||
					(l.machineId ?? '').toLowerCase().includes(q),
			)
		}
		return list
	}, [licenses, filter, query])

	const handleRenew = async (license: Licenca, months: number) => {
		try {
			const updated = await renovar(adminKey, license.id, months)
			setLicenses((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
			showToast(`Licença renovada por ${months} ${months === 1 ? 'mês' : 'meses'}.`, 'success')
		} catch {
			showToast('Erro ao renovar licença.', 'danger')
		}
		setModal(null)
	}

	const handleRevoke = async (license: Licenca) => {
		try {
			const updated = await revogar(adminKey, license.id)
			setLicenses((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
			showToast(`Licença ${license.chave} revogada.`, 'danger')
		} catch {
			showToast('Erro ao revogar licença.', 'danger')
		}
		setModal(null)
	}

	const handleUnbind = async (license: Licenca) => {
		try {
			const updated = await desvincular(adminKey, license.id)
			setLicenses((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
			showToast(`Máquina desvinculada de ${license.chave}.`, 'purple')
		} catch {
			showToast('Erro ao desvincular máquina.', 'danger')
		}
		setModal(null)
	}

	const handleCreate = async (clienteNome: string, months: number) => {
		try {
			const nova = await criar(adminKey, clienteNome, months)
			setLicenses((prev) => [nova, ...prev])
			showToast(`Licença criada para ${clienteNome}.`, 'success')
		} catch {
			showToast('Erro ao criar licença.', 'danger')
		}
		setModal(null)
	}

	return (
		<div className="adm-dash">
			<div className="adm-topbar">
				<div className="brand">
					<div className="brand-mark">SB</div>
					<div>
						<div className="brand-name">Stand By</div>
						<div className="brand-tag">Admin Console</div>
					</div>
				</div>
				<div className="divider" />
				<div className="adm-crumb">
					<span>Licenças</span>
					<span className="arrow">›</span>
					<span style={{ color: 'var(--text-2)' }}>Todas</span>
				</div>

				<div className="adm-top-spacer" />

				<button className="adm-user" onClick={onLogout} title="Sair">
					<div className="avatar">AA</div>
					<div>
						<div className="user-name">Adriano Andrade</div>
						<div className="user-role">Super Admin</div>
					</div>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-3)', marginLeft: 4 }}>
						<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
						<polyline points="16 17 21 12 16 7" />
						<line x1="21" y1="12" x2="9" y2="12" />
					</svg>
				</button>
			</div>

			<div className="adm-main">
				<div className="adm-page-head">
					<div>
						<h1 className="adm-page-title">
							Licenças
							<span className="adm-live-pill"><span className="d" />Live</span>
						</h1>
						<div className="adm-page-sub">{counts.total} licenças no total</div>
					</div>
					<div className="adm-head-actions">
						<button className="adm-btn adm-btn-ghost" onClick={fetchLicenses}>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="23 4 23 10 17 10" />
								<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
							</svg>
							Atualizar
						</button>
						<button className="adm-btn adm-btn-accent" onClick={() => setModal({ kind: 'new' })}>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
								<line x1="12" y1="5" x2="12" y2="19" />
								<line x1="5" y1="12" x2="19" y2="12" />
							</svg>
							Nova licença
						</button>
					</div>
				</div>

				<div className="adm-kpis">
					<Kpi tone="total" label="Total" value={counts.total}
						icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>}
						trend={<span style={{ color: 'var(--text-3)' }}>todas as licenças</span>}
					/>
					<Kpi tone="ativa" label="Ativas" value={counts.ativa}
						icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
						trend={<span style={{ color: 'var(--text-3)' }}>{counts.total ? Math.round((counts.ativa / counts.total) * 100) : 0}% do total</span>}
					/>
					<Kpi tone="expirada" label="Expiradas" value={counts.expirada}
						icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
						trend={<span><span className="down">{counts.expirada > 0 ? `↑ ${counts.expirada}` : '—'}</span> aguardando renovação</span>}
					/>
					<Kpi tone="revogada" label="Revogadas" value={counts.revogada}
						icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>}
						trend={<span style={{ color: 'var(--text-3)' }}>Bloqueio permanente</span>}
					/>
				</div>

				<div className="adm-toolbar">
					<div className="adm-filter-chips">
						<FilterChip active={filter === 'todas'} onClick={() => setFilter('todas')} count={counts.total}>Todas</FilterChip>
						<FilterChip active={filter === 'ativa'} onClick={() => setFilter('ativa')} count={counts.ativa} tone="ok">Ativa</FilterChip>
						<FilterChip active={filter === 'expirada'} onClick={() => setFilter('expirada')} count={counts.expirada} tone="warn">Expirada</FilterChip>
						<FilterChip active={filter === 'revogada'} onClick={() => setFilter('revogada')} count={counts.revogada} tone="danger">Revogada</FilterChip>
					</div>

					<div className="adm-search">
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
							<circle cx="11" cy="11" r="7" />
							<line x1="21" y1="21" x2="16.65" y2="16.65" />
						</svg>
						<input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="buscar por chave, cliente, máquina…"
						/>
						{query ? (
							<button className="clear-btn" onClick={() => setQuery('')}>
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							</button>
						) : <kbd>⌘K</kbd>}
					</div>
				</div>

				<div className="adm-table-wrap">
					{loading ? (
						<div className="adm-loading">
							<div className="spinner" />
							Carregando licenças…
						</div>
					) : filtered.length === 0 ? (
						<div className="adm-empty">
							<div className="icon-wrap">
								<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
									<circle cx="11" cy="11" r="7" />
									<line x1="21" y1="21" x2="16.65" y2="16.65" />
								</svg>
							</div>
							<div className="empty-title">Nenhuma licença encontrada</div>
							<div className="empty-sub">Tente ajustar os filtros ou a busca</div>
						</div>
					) : (
						<>
							<table className="adm-table">
								<thead>
									<tr>
										<th>Chave</th>
										<th>Cliente</th>
										<th>Expira em</th>
										<th>Status</th>
										<th>Máquina vinculada</th>
										<th style={{ textAlign: 'right' }}>Ações</th>
									</tr>
								</thead>
								<tbody>
									{filtered.map((l, i) => (
										<LicenseRow
											key={l.id}
											license={l}
											index={i}
											onRenew={() => setModal({ kind: 'renew', license: l, months: 12 })}
											onRevoke={() => setModal({ kind: 'revoke', license: l })}
											onUnbind={() => setModal({ kind: 'unbind', license: l })}
											onCopy={() => {
												navigator.clipboard?.writeText(l.chave).catch(() => {})
												showToast('Chave copiada para a área de transferência')
											}}
										/>
									))}
								</tbody>
							</table>
							<div className="adm-pagination">
								<div>Mostrando <span style={{ color: 'var(--text-1)' }}>{filtered.length}</span> de {counts.total}</div>
								<div>Página 1 de 1</div>
							</div>
						</>
					)}
				</div>
			</div>

			{modal?.kind === 'renew' && (
				<RenewModal
					license={modal.license}
					months={modal.months}
					onMonthsChange={(m) => setModal({ ...modal, months: m })}
					onCancel={() => setModal(null)}
					onConfirm={() => handleRenew(modal.license, modal.months)}
				/>
			)}
			{modal?.kind === 'revoke' && (
				<RevokeModal
					license={modal.license}
					onCancel={() => setModal(null)}
					onConfirm={() => handleRevoke(modal.license)}
				/>
			)}
			{modal?.kind === 'unbind' && (
				<UnbindModal
					license={modal.license}
					onCancel={() => setModal(null)}
					onConfirm={() => handleUnbind(modal.license)}
				/>
			)}
			{modal?.kind === 'new' && (
				<NewLicenseModal
					onCancel={() => setModal(null)}
					onConfirm={handleCreate}
				/>
			)}

			{toast && <ToastNotif msg={toast.msg} kind={toast.kind} key={toast.id} />}
		</div>
	)
}

// ===== Sub-components =====

function Kpi({ tone, label, value, icon, trend }: {
	tone: string; label: string; value: number; icon: React.ReactNode; trend: React.ReactNode
}) {
	return (
		<div className={`adm-kpi k-${tone}`}>
			<div className="adm-kpi-head">
				<div className="adm-kpi-icon">{icon}</div>
				<div className="adm-kpi-label">{label}</div>
			</div>
			<div className="adm-kpi-value">{value}</div>
			<div className="adm-kpi-trend">{trend}</div>
		</div>
	)
}

function FilterChip({ active, onClick, count, tone, children }: {
	active: boolean; onClick: () => void; count: number; tone?: string; children: React.ReactNode
}) {
	return (
		<button className={`filter-chip ${active ? 'active' : ''}`} onClick={onClick}>
			{tone && (
				<span style={{
					width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
					background: tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--warn)' : 'var(--danger)',
					boxShadow: tone === 'ok' ? '0 0 6px var(--ok)' : tone === 'warn' ? '0 0 6px var(--warn)' : '0 0 6px var(--danger)',
				}} />
			)}
			{children}
			<span className="count">{count}</span>
		</button>
	)
}

function LicenseRow({ license: l, index, onRenew, onRevoke, onUnbind, onCopy }: {
	license: Licenca; index: number
	onRenew: () => void; onRevoke: () => void; onUnbind: () => void; onCopy: () => void
}) {
	const [copied, setCopied] = useState(false)
	const status = getStatus(l)
	const rel = relativeExpiry(l.expiraEm)
	const isRevoked = status === 'revogada'
	const suffix = l.chave.replace('STANDBY', '')

	return (
		<tr>
			<td>
				<span className="adm-key">
					<span><span className="standby-prefix">STANDBY</span>{suffix}</span>
					<button
						className={`copy-key ${copied ? 'copied' : ''}`}
						onClick={(e) => {
							e.stopPropagation()
							onCopy()
							setCopied(true)
							setTimeout(() => setCopied(false), 1400)
						}}
						title="Copiar chave"
					>
						{copied ? (
							<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="20 6 9 17 4 12" />
							</svg>
						) : (
							<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<rect x="9" y="9" width="13" height="13" rx="2" />
								<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
							</svg>
						)}
					</button>
				</span>
			</td>
			<td>
				<div className="adm-client">
					<div className="avatar" style={{ background: gradientFor(index) }}>{initialsOf(l.clienteNome)}</div>
					<div>
						<div className="name">{l.clienteNome}</div>
					</div>
				</div>
			</td>
			<td>
				<div className="adm-expires">
					<span className="date">{formatDateBR(l.expiraEm)}</span>
					{!isRevoked && <span className={`rel ${rel.tone}`}>{rel.text}</span>}
					{isRevoked && <span className="rel danger">acesso bloqueado</span>}
				</div>
			</td>
			<td>
				<span className={`adm-status-badge ${status}`}>{status}</span>
			</td>
			<td>
				<div className={`adm-machine ${l.machineId ? 'bound' : 'unbound'}`}>
					<div className="m-icon">
						{l.machineId ? (
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
								<rect x="2" y="3" width="20" height="14" rx="2" />
								<line x1="8" y1="21" x2="16" y2="21" />
								<line x1="12" y1="17" x2="12" y2="21" />
							</svg>
						) : (
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
								<line x1="3" y1="3" x2="21" y2="21" />
								<path d="M16 16H4a2 2 0 0 1-2-2V6" />
								<path d="M22 14V6a2 2 0 0 0-2-2H8" />
							</svg>
						)}
					</div>
					<div className="m-body">
						<div className="m-name">{l.machineId ? l.machineId : 'Não vinculada'}</div>
					</div>
				</div>
			</td>
			<td>
				<div className="adm-actions">
					<button className="adm-action renew" onClick={onRenew} disabled={isRevoked}>
						<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
							<polyline points="23 4 23 10 17 10" />
							<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
						</svg>
						Renovar
					</button>
					<button className="adm-action revoke" onClick={onRevoke} disabled={isRevoked}>
						<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
							<circle cx="12" cy="12" r="10" />
							<line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
						</svg>
						Revogar
					</button>
					<button className="adm-action unbind" onClick={onUnbind} disabled={!l.machineId}>
						<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
							<line x1="3" y1="3" x2="21" y2="21" />
							<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 6.36 7.36" />
						</svg>
						Desvincular
					</button>
				</div>
			</td>
		</tr>
	)
}

function RenewModal({ license, months, onMonthsChange, onCancel, onConfirm }: {
	license: Licenca; months: number
	onMonthsChange: (m: number) => void; onCancel: () => void; onConfirm: () => void
}) {
	const options = [1, 3, 6, 12]
	const base = new Date(Math.max(Date.now(), new Date(license.expiraEm.slice(0, 10) + 'T00:00:00').getTime()))
	base.setMonth(base.getMonth() + months)
	const newExpiry = formatDateBR(base.toISOString().slice(0, 10))

	return (
		<div className="adm-modal-scrim" onClick={onCancel}>
			<div className="adm-modal success" onClick={(e) => e.stopPropagation()}>
				<div className="adm-modal-head">
					<div className="adm-modal-icon">
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
							<polyline points="23 4 23 10 17 10" />
							<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
						</svg>
					</div>
					<div>
						<h3 className="adm-modal-title">Renovar licença</h3>
						<div className="adm-modal-sub">{license.clienteNome}</div>
					</div>
				</div>
				<div className="adm-modal-body">
					Selecione o período de extensão para a chave <span className="key-display">{license.chave}</span>.
					<div className="renew-options">
						{options.map((m) => (
							<div key={m} className={`renew-opt ${months === m ? 'selected' : ''}`} onClick={() => onMonthsChange(m)}>
								<div className="n">{m}</div>
								<div className="u">{m === 1 ? 'mês' : 'meses'}</div>
							</div>
						))}
					</div>
					<div style={{ marginTop: 18, padding: '12px 14px', background: 'rgba(54, 211, 153, 0.08)', border: '1px solid rgba(54, 211, 153, 0.25)', borderRadius: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--f-mono)', fontSize: 12.5 }}>
						<span style={{ color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 10 }}>Nova validade</span>
						<span style={{ color: 'var(--ok)', fontWeight: 600 }}>{newExpiry}</span>
					</div>
				</div>
				<div className="adm-modal-foot">
					<button className="adm-btn adm-btn-ghost" onClick={onCancel}>Cancelar</button>
					<button className="adm-btn adm-btn-ok" onClick={onConfirm}>
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
							<polyline points="20 6 9 17 4 12" />
						</svg>
						Confirmar renovação
					</button>
				</div>
			</div>
		</div>
	)
}

function RevokeModal({ license, onCancel, onConfirm }: { license: Licenca; onCancel: () => void; onConfirm: () => void }) {
	return (
		<div className="adm-modal-scrim" onClick={onCancel}>
			<div className="adm-modal danger" onClick={(e) => e.stopPropagation()}>
				<div className="adm-modal-head">
					<div className="adm-modal-icon">
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
							<circle cx="12" cy="12" r="10" />
							<line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
						</svg>
					</div>
					<div>
						<h3 className="adm-modal-title">Revogar licença</h3>
						<div className="adm-modal-sub">Ação irreversível</div>
					</div>
				</div>
				<div className="adm-modal-body">
					Você está prestes a revogar a licença <span className="key-display">{license.chave}</span> de <strong>{license.clienteNome}</strong>.
					<div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(248, 114, 114, 0.08)', border: '1px solid rgba(248, 114, 114, 0.25)', borderRadius: 9, fontSize: 13, color: 'var(--text-2)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 2 }}>
							<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
							<line x1="12" y1="9" x2="12" y2="13" />
							<line x1="12" y1="17" x2="12.01" y2="17" />
						</svg>
						<div>O cliente perderá acesso ao sistema <strong>imediatamente</strong>. A licença não poderá ser reativada — será necessário emitir uma nova chave.</div>
					</div>
				</div>
				<div className="adm-modal-foot">
					<button className="adm-btn adm-btn-ghost" onClick={onCancel}>Cancelar</button>
					<button className="adm-btn adm-btn-danger" onClick={onConfirm}>
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
							<circle cx="12" cy="12" r="10" />
							<line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
						</svg>
						Sim, revogar agora
					</button>
				</div>
			</div>
		</div>
	)
}

function UnbindModal({ license, onCancel, onConfirm }: { license: Licenca; onCancel: () => void; onConfirm: () => void }) {
	return (
		<div className="adm-modal-scrim" onClick={onCancel}>
			<div className="adm-modal warning" onClick={(e) => e.stopPropagation()}>
				<div className="adm-modal-head">
					<div className="adm-modal-icon">
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
							<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
							<line x1="3" y1="3" x2="21" y2="21" />
							<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 6.36 7.36" />
						</svg>
					</div>
					<div>
						<h3 className="adm-modal-title">Desvincular máquina</h3>
						<div className="adm-modal-sub">Liberação de hardware</div>
					</div>
				</div>
				<div className="adm-modal-body">
					Deseja desvincular a máquina <strong>{license.machineId}</strong> da licença de <strong>{license.clienteNome}</strong>?
					<div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--text-3)' }}>
						O cliente poderá ativar a licença em outro dispositivo na próxima abertura do sistema.
					</div>
				</div>
				<div className="adm-modal-foot">
					<button className="adm-btn adm-btn-ghost" onClick={onCancel}>Cancelar</button>
					<button className="adm-btn adm-btn-purple" onClick={onConfirm}>
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
							<polyline points="20 6 9 17 4 12" />
						</svg>
						Desvincular
					</button>
				</div>
			</div>
		</div>
	)
}

function NewLicenseModal({ onCancel, onConfirm }: {
	onCancel: () => void; onConfirm: (clienteNome: string, months: number) => void
}) {
	const [clienteNome, setClienteNome] = useState('')
	const [months, setMonths] = useState(12)
	const options = [1, 3, 6, 12]

	return (
		<div className="adm-modal-scrim" onClick={onCancel}>
			<div className="adm-modal success" onClick={(e) => e.stopPropagation()}>
				<div className="adm-modal-head">
					<div className="adm-modal-icon">
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
							<line x1="12" y1="5" x2="12" y2="19" />
							<line x1="5" y1="12" x2="19" y2="12" />
						</svg>
					</div>
					<div>
						<h3 className="adm-modal-title">Nova licença</h3>
						<div className="adm-modal-sub">Emitir chave de acesso</div>
					</div>
				</div>
				<div className="adm-modal-body">
					<div className="adm-field" style={{ marginBottom: 18 }}>
						<label className="adm-field-label">
							<span>Nome do cliente</span>
							<span className="hint">requerido</span>
						</label>
						<div className="adm-input-wrap">
							<input
								type="text"
								value={clienteNome}
								onChange={(e) => setClienteNome(e.target.value)}
								placeholder="ex: TechFix Assistência"
								autoFocus
							/>
						</div>
					</div>
					<div style={{ marginBottom: 6, fontFamily: 'var(--f-mono)', fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Duração</div>
					<div className="renew-options">
						{options.map((m) => (
							<div key={m} className={`renew-opt ${months === m ? 'selected' : ''}`} onClick={() => setMonths(m)}>
								<div className="n">{m}</div>
								<div className="u">{m === 1 ? 'mês' : 'meses'}</div>
							</div>
						))}
					</div>
				</div>
				<div className="adm-modal-foot">
					<button className="adm-btn adm-btn-ghost" onClick={onCancel}>Cancelar</button>
					<button className="adm-btn adm-btn-ok" onClick={() => onConfirm(clienteNome.trim(), months)} disabled={!clienteNome.trim()}>
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
							<polyline points="20 6 9 17 4 12" />
						</svg>
						Emitir licença
					</button>
				</div>
			</div>
		</div>
	)
}

function ToastNotif({ msg, kind }: { msg: string; kind: string }) {
	const [show, setShow] = useState(false)
	useEffect(() => {
		const t = setTimeout(() => setShow(true), 10)
		return () => clearTimeout(t)
	}, [])
	return (
		<div className={`adm-toast ${show ? 'show' : ''} ${kind}`}>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
				{kind === 'danger' ? (
					<><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
				) : (
					<polyline points="20 6 9 17 4 12" />
				)}
			</svg>
			<span>{msg}</span>
		</div>
	)
}
