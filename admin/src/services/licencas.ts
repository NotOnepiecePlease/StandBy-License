const API_URL = import.meta.env.VITE_API_URL ?? 'https://standby-license-production.up.railway.app'

export interface Licenca {
	id: string
	chave: string
	machineId: string | null
	clienteNome: string
	expiraEm: string
	ativo: boolean
	expirada?: boolean
	criadoEm: string
}

export type LicencaStatus = 'ativa' | 'expirada' | 'revogada'

export function getStatus(l: Licenca): LicencaStatus {
	if (!l.ativo) return 'revogada'
	const expired = l.expirada ?? new Date(l.expiraEm) < new Date()
	if (expired) return 'expirada'
	return 'ativa'
}

function headers(key: string) {
	return { 'Content-Type': 'application/json', 'X-Admin-Key': key }
}

export async function listar(key: string): Promise<Licenca[]> {
	const res = await fetch(`${API_URL}/api/admin/licencas`, { headers: headers(key) })
	if (res.status === 401) throw new Error('unauthorized')
	if (!res.ok) throw new Error(`Erro ${res.status}`)
	return res.json()
}

export async function criar(key: string, clienteNome: string, duracaoMeses: number): Promise<Licenca> {
	const res = await fetch(`${API_URL}/api/admin/licencas`, {
		method: 'POST',
		headers: headers(key),
		body: JSON.stringify({ clienteNome, duracaoMeses }),
	})
	if (res.status === 401) throw new Error('unauthorized')
	if (!res.ok) throw new Error(`Erro ${res.status}`)
	return res.json()
}

export async function renovar(key: string, id: string, duracaoMeses: number): Promise<Licenca> {
	const res = await fetch(`${API_URL}/api/admin/licencas/${id}/renovar`, {
		method: 'POST',
		headers: headers(key),
		body: JSON.stringify({ duracaoMeses }),
	})
	if (res.status === 401) throw new Error('unauthorized')
	if (!res.ok) throw new Error(`Erro ${res.status}`)
	return res.json()
}

export async function revogar(key: string, id: string): Promise<Licenca> {
	const res = await fetch(`${API_URL}/api/admin/licencas/${id}/revogar`, {
		method: 'POST',
		headers: headers(key),
	})
	if (res.status === 401) throw new Error('unauthorized')
	if (!res.ok) throw new Error(`Erro ${res.status}`)
	return res.json()
}

export async function reativar(key: string, id: string): Promise<Licenca> {
	const res = await fetch(`${API_URL}/api/admin/licencas/${id}/reativar`, {
		method: 'POST',
		headers: headers(key),
	})
	if (res.status === 401) throw new Error('unauthorized')
	if (!res.ok) throw new Error(`Erro ${res.status}`)
	return res.json()
}

export async function desvincular(key: string, id: string): Promise<Licenca> {
	const res = await fetch(`${API_URL}/api/admin/licencas/${id}/desvincular`, {
		method: 'POST',
		headers: headers(key),
	})
	if (res.status === 401) throw new Error('unauthorized')
	if (!res.ok) throw new Error(`Erro ${res.status}`)
	return res.json()
}
