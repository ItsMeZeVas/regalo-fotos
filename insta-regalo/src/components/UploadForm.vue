<script setup>
import { ref } from 'vue'

const emit = defineEmits(['uploaded'])

const file = ref(null)
const caption = ref('')
const uploader = ref(localStorage.getItem('uploader_name') || '')
const passcode = ref('')
const uploading = ref(false)
const statusMsg = ref('')

function onFileChange(e) {
  file.value = e.target.files[0] || null
}

function toBase64(f) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(f)
  })
}

async function submit() {
  if (!file.value) {
    statusMsg.value = 'Selecciona una foto primero.'
    return
  }
  uploading.value = true
  statusMsg.value = 'Subiendo...'
  try {
    localStorage.setItem('uploader_name', uploader.value)
    const base64 = await toBase64(file.value)
    const ext = file.value.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename,
        imageBase64: base64,
        caption: caption.value,
        uploader: uploader.value,
        passcode: passcode.value
      })
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Error al subir la foto')
    }

    statusMsg.value = '¡Foto subida! 🎉'
    file.value = null
    caption.value = ''
    emit('uploaded')
  } catch (e) {
    statusMsg.value = `Error: ${e.message}`
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="upload-box">
    <input type="text" v-model="uploader" placeholder="Tu nombre" style="width:100%;margin-bottom:8px;padding:8px;border:1px solid #dbdbdb;border-radius:8px;" />
    <input type="password" v-model="passcode" placeholder="Clave secreta" style="width:100%;margin-bottom:8px;padding:8px;border:1px solid #dbdbdb;border-radius:8px;" />
    <input type="file" accept="image/*" @change="onFileChange" />
    <textarea v-model="caption" placeholder="Escribe algo sobre esta foto..." rows="2"></textarea>
    <button :disabled="uploading" @click="submit">
      {{ uploading ? 'Subiendo...' : 'Publicar foto' }}
    </button>
    <div class="status" v-if="statusMsg">{{ statusMsg }}</div>
  </div>
</template>
