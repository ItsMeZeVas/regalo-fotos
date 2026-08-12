// Vercel Serverless Function: /api/edit
// Actualiza la descripción (caption) de una foto en fotos.json.

const GITHUB_API = 'https://api.github.com'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { filename, caption, passcode } = req.body || {}

  if (process.env.UPLOAD_PASSCODE && passcode !== process.env.UPLOAD_PASSCODE) {
    return res.status(401).json({ error: 'Clave incorrecta' })
  }
  if (!filename) {
    return res.status(400).json({ error: 'Falta el nombre del archivo' })
  }

  const {
    GITHUB_TOKEN,
    GITHUB_OWNER,
    GITHUB_REPO,
    GITHUB_BRANCH = 'main'
  } = process.env

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return res.status(500).json({ error: 'Faltan variables de entorno en el servidor' })
  }

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json'
  }

  try {
    const getJsonRes = await fetch(
      `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/fotos.json?ref=${GITHUB_BRANCH}`,
      { headers }
    )
    if (!getJsonRes.ok) {
      throw new Error('No se pudo leer fotos.json')
    }
    const jsonFile = await getJsonRes.json()
    const decoded = Buffer.from(jsonFile.content, 'base64').toString('utf-8')
    let entries = JSON.parse(decoded)

    const idx = entries.findIndex(e => e.filename === filename)
    if (idx === -1) {
      return res.status(404).json({ error: 'No se encontró esa foto' })
    }
    entries[idx].caption = caption || ''

    const newContent = Buffer.from(JSON.stringify(entries, null, 2)).toString('base64')
    const putJsonRes = await fetch(
      `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/fotos.json`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `Edita descripción de ${filename}`,
          content: newContent,
          branch: GITHUB_BRANCH,
          sha: jsonFile.sha
        })
      }
    )
    if (!putJsonRes.ok) {
      const err = await putJsonRes.json()
      throw new Error(`No se pudo actualizar fotos.json: ${err.message}`)
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
