<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['uploaded'])

const file = ref(null)
const previewUrl = ref(null)
const caption = ref('')
const uploader = ref(localStorage.getItem('uploader_name') || '')
const passcode = ref('')
const uploading = ref(false)
const statusMsg = ref('')
const fileInput = ref(null)

function openFilePicker() {
  fileInput.value?.click()
}

function onFileChange(e) {
  const f = e.target.files[0] || null
  file.value = f
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = f ? URL.createObjectURL(f) : null
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

    statusMsg.value = '¡Foto enviada, esperando a que JJ Jameson las apruebe, esto puede tardar un poco!'
    file.value = null
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
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
    <input type="text" v-model="uploader" placeholder="Tu nombre" />
    <input type="password" v-model="passcode" placeholder="Clave secreta" />

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="file-input-hidden"
      @change="onFileChange"
    />

    <div class="dropzone" :class="{ 'has-image': previewUrl }" @click="openFilePicker">
      <img v-if="previewUrl" :src="previewUrl" class="dropzone-preview" alt="Vista previa" />
      <template v-else>
        <div class="dropzone-icon">⇪</div>
        <div class="dropzone-text">Carga una imagen</div>
      </template>
    </div>
    <button type="button" class="pick-btn" @click="openFilePicker">
      {{ file ? 'Cambiar imagen' : 'Buscar una imagen' }}
    </button>

    <textarea v-model="caption" placeholder="Escribe algo sobre esta foto..." rows="2"></textarea>
    <button :disabled="uploading" @click="submit">
      {{ uploading ? 'Subiendo...' : 'Publicar foto' }}
    </button>
    <div class="status" v-if="statusMsg">{{ statusMsg }}</div>
  </div>
</template>
