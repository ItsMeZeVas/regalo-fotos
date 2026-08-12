// Vercel Serverless Function: /api/delete
// Borra la imagen del repo y su entrada en fotos.json.

const GITHUB_API = 'https://api.github.com'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { filename, passcode } = req.body || {}

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
    // 1) Borrar la imagen (necesita el sha del archivo)
    const photoPath = `fotos/${filename}`
    const getPhotoRes = await fetch(
      `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${photoPath}?ref=${GITHUB_BRANCH}`,
      { headers }
    )
    if (getPhotoRes.ok) {
      const photoFile = await getPhotoRes.json()
      const delRes = await fetch(
        `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${photoPath}`,
        {
          method: 'DELETE',
          headers,
          body: JSON.stringify({
            message: `Elimina foto: ${filename}`,
            sha: photoFile.sha,
            branch: GITHUB_BRANCH
          })
        }
      )
      if (!delRes.ok) {
        const err = await delRes.json()
        throw new Error(`No se pudo borrar la imagen: ${err.message}`)
      }
    }
    // si el archivo ya no existe, seguimos igual para limpiar fotos.json

    // 2) Quitar la entrada de fotos.json
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
    entries = entries.filter(e => e.filename !== filename)

    const newContent = Buffer.from(JSON.stringify(entries, null, 2)).toString('base64')
    const putJsonRes = await fetch(
      `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/fotos.json`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `Quita ${filename} de fotos.json`,
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
