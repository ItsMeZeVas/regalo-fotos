// Vercel Serverless Function: /api/upload
// Recibe una foto en base64 y la sube al repo de GitHub via Contents API.
// El token nunca se expone al navegador: solo vive como variable de entorno en Vercel.

const GITHUB_API = 'https://api.github.com'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { filename, imageBase64, caption, uploader, passcode } = req.body || {}

  // Protección simple para que no cualquiera con el link pueda escribir en tu repo
  if (process.env.UPLOAD_PASSCODE && passcode !== process.env.UPLOAD_PASSCODE) {
    return res.status(401).json({ error: 'Clave incorrecta' })
  }

  if (!filename || !imageBase64) {
    return res.status(400).json({ error: 'Falta la imagen' })
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
    // 1) Subir la imagen a /fotos/{filename}
    const photoPath = `fotos/${filename}`
    const putPhotoRes = await fetch(
      `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${photoPath}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `Nueva foto: ${filename}`,
          content: imageBase64,
          branch: GITHUB_BRANCH
        })
      }
    )
    if (!putPhotoRes.ok) {
      const err = await putPhotoRes.json()
      throw new Error(`No se pudo subir la imagen: ${err.message}`)
    }

    // 2) Leer fotos.json actual (para obtener su SHA y contenido)
    let entries = []
    let sha = undefined
    const getJsonRes = await fetch(
      `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/fotos.json?ref=${GITHUB_BRANCH}`,
      { headers }
    )
    if (getJsonRes.ok) {
      const jsonFile = await getJsonRes.json()
      sha = jsonFile.sha
      const decoded = Buffer.from(jsonFile.content, 'base64').toString('utf-8')
      entries = JSON.parse(decoded)
    }
    // Si fotos.json no existe todavía (404), simplemente se crea de cero (entries = [])

    // 3) Agregar la nueva entrada y volver a subir fotos.json
    entries.push({
      filename,
      caption: caption || '',
      uploader: uploader || '',
      date: new Date().toISOString()
    })

    const newContent = Buffer.from(JSON.stringify(entries, null, 2)).toString('base64')

    const putJsonRes = await fetch(
      `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/fotos.json`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `Actualiza fotos.json con ${filename}`,
          content: newContent,
          branch: GITHUB_BRANCH,
          sha
        })
      }
    )
    if (!putJsonRes.ok) {
      const err = await putJsonRes.json()
      throw new Error(`No se pudo actualizar fotos.json: ${err.message}`)
    }

    return res.status(200).json({ ok: true, filename })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
