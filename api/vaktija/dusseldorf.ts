async function fetchVaktijaDailyData(city: string, locale: string) {
  const cityPageUrl = `https://vaktija.eu/${city}`
  const cityPageResponse = await fetch(cityPageUrl, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'IKC-Duesseldorf/1.0'
    }
  })

  if (!cityPageResponse.ok) {
    throw new Error(`Failed to load city page (${cityPageResponse.status})`)
  }

  const cityPageHtml = await cityPageResponse.text()
  const buildIdMatch = cityPageHtml.match(/"buildId":"([^"]+)"/)
  if (!buildIdMatch?.[1]) {
    throw new Error('Could not detect Vaktija build ID')
  }

  const buildId = buildIdMatch[1]
  const dataUrl = `https://vaktija.eu/_next/data/${buildId}/${locale}/${city}.json`

  const dataResponse = await fetch(dataUrl, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'IKC-Duesseldorf/1.0'
    }
  })

  if (!dataResponse.ok) {
    throw new Error(`Failed to load Vaktija JSON (${dataResponse.status})`)
  }

  const payload = await dataResponse.json()
  return {
    pageProps: {
      dailyPrayersRes: payload?.pageProps?.dailyPrayersRes ?? null,
      todayGregorian: payload?.pageProps?.todayGregorian ?? null,
      todayHijri: payload?.pageProps?.todayHijri ?? null
    }
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const payload = await fetchVaktijaDailyData('dusseldorf', 'bs')
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=300')
    res.status(200).json(payload)
  } catch {
    res.status(502).json({ error: 'Vaktija proxy unavailable' })
  }
}
