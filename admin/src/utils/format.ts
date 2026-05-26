const GRADIENTS: [string, string][] = [
	['#ff0067', '#8b5cf6'],
	['#5b8def', '#8b5cf6'],
	['#36d399', '#5b8def'],
	['#fbbd23', '#ff0067'],
	['#a78bfa', '#5b8def'],
	['#ff5b9e', '#ff0067'],
	['#36d399', '#36d399'],
	['#5b8def', '#36d399'],
]

export function gradientFor(index: number): string {
	const g = GRADIENTS[index % GRADIENTS.length]
	return `linear-gradient(135deg, ${g[0]}, ${g[1]})`
}

export function initialsOf(name: string): string {
	return name
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((s) => s[0])
		.join('')
		.toUpperCase()
}

export function formatDateBR(iso: string): string {
	const [y, m, d] = iso.slice(0, 10).split('-')
	return `${d}/${m}/${y}`
}

export function daysFromToday(iso: string): number {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const target = new Date(iso.slice(0, 10) + 'T00:00:00')
	return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function relativeExpiry(iso: string): { text: string; tone: string } {
	const d = daysFromToday(iso)
	if (d > 30) return { text: `em ${d} dias`, tone: '' }
	if (d > 0) return { text: `em ${d} ${d === 1 ? 'dia' : 'dias'}`, tone: 'warn' }
	if (d === 0) return { text: 'expira hoje', tone: 'danger' }
	return { text: `há ${Math.abs(d)} dias`, tone: 'danger' }
}
