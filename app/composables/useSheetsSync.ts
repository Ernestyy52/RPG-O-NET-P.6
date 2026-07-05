export function useSheetsSync() {
  const config = useRuntimeConfig()
  const apiUrl = config.public.sheetsApiUrl

  async function savePlayer(data: Record<string, unknown>) {
    if (!apiUrl) return
    await fetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify({ action: 'save', data }),
    }).catch(() => {})
  }

  async function loadPlayer(name: string) {
    if (!apiUrl) return null
    const res = await fetch(`${apiUrl}?action=load&name=${encodeURIComponent(name)}`).catch(() => null)
    if (!res) return null
    return res.json()
  }

  async function getLeaderboard() {
    if (!apiUrl) return []
    const res = await fetch(`${apiUrl}?action=leaderboard`).catch(() => null)
    if (!res) return []
    return res.json()
  }

  return { savePlayer, loadPlayer, getLeaderboard }
}
