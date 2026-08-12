<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { RAW_BASE } from '../config.js'

const photos = ref([])
const loading = ref(true)
const refreshing = ref(false)
const imgVersion = ref(Date.now())
const postRefs = ref({})

const editingFilename = ref(null)
const editText = ref('')
const busyFilename = ref(null) // foto que se está editando/borrando en el servidor
const viewMode = ref('list') // 'list' | 'grid'

async function loadPhotos(isRefresh = false) {
  if (isRefresh) {
    refreshing.value = true
  } else {
    loading.value = true
  }
  try {
    const res = await fetch(`${RAW_BASE}/fotos.json?t=${Date.now()}`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      photos.value = data.sort((a, b) => new Date(b.date) - new Date(a.date))
    } else {
      photos.value = []
    }
    imgVersion.value = Date.now()
  } catch (e) {
    photos.value = []
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

onMounted(() => loadPhotos())

function setPostRef(filename, el) {
  if (el) postRefs.value[filename] = el
}

function goToPhoto(photo) {
  viewMode.value = 'list'
  nextTick(() => {
    const el = postRefs.value[photo.filename]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function startEdit(photo) {
  editingFilename.value = photo.filename
  editText.value = photo.caption || ''
}

function cancelEdit() {
  editingFilename.value = null
  editText.value = ''
}

async function saveEdit(photo) {
  const passcode = window.prompt('Clave secreta para guardar el cambio:')
  if (passcode === null) return
  busyFilename.value = photo.filename
  try {
    const res = await fetch('/api/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: photo.filename, caption: editText.value, passcode })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'No se pudo guardar')
    }
    cancelEdit()
    await loadPhotos(true)
  } catch (e) {
    alert(`Error: ${e.message}`)
  } finally {
    busyFilename.value = null
  }
}

async function deletePhoto(photo) {
  if (!window.confirm('¿Eliminar esta foto para siempre?')) return
  const passcode = window.prompt('Clave secreta para eliminar:')
  if (passcode === null) return
  busyFilename.value = photo.filename
  try {
    const res = await fetch('/api/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: photo.filename, passcode })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'No se pudo eliminar')
    }
    await loadPhotos(true)
  } catch (e) {
    alert(`Error: ${e.message}`)
  } finally {
    busyFilename.value = null
  }
}
</script>

<template>
  <div>
    <div class="refresh-bar">
      <button class="refresh-btn" :disabled="refreshing" @click="loadPhotos(true)">
        {{ refreshing ? 'Actualizando...' : '↻ Actualizar' }}
      </button>
      <div class="view-toggle">
        <button
          class="view-btn"
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
          aria-label="Ver en fila"
        >☰</button>
        <button
          class="view-btn"
          :class="{ active: viewMode === 'grid' }"
          @click="viewMode = 'grid'"
          aria-label="Ver en cuadrícula"
        >▦</button>
      </div>
    </div>
    <div v-if="loading" class="empty">Cargando recuerdos...</div>
    <div v-else-if="photos.length === 0" class="empty">
      Todavía no hay fotos. ¡Sube la primera! 📸
    </div>

    <!-- Vista en cuadrícula: solo fotos, sin acciones -->
    <div v-else-if="viewMode === 'grid'" class="posts-grid">
      <img
        v-for="photo in photos"
        :key="photo.filename"
        :src="`${RAW_BASE}/fotos/${photo.filename}?t=${imgVersion}`"
        :alt="photo.caption"
        loading="lazy"
        @click="goToPhoto(photo)"
      />
    </div>

    <!-- Vista en fila: la tarjeta completa con edición y eliminación -->
    <div v-else>
      <div v-for="photo in photos" :key="photo.filename" class="post" :ref="el => setPostRef(photo.filename, el)">
        <img :src="`${RAW_BASE}/fotos/${photo.filename}?t=${imgVersion}`" :alt="photo.caption" loading="lazy" />

        <div v-if="editingFilename === photo.filename" class="post-edit">
          <textarea v-model="editText" rows="2"></textarea>
          <div class="post-edit-actions">
            <button class="link-btn" :disabled="busyFilename === photo.filename" @click="saveEdit(photo)">Guardar</button>
            <button class="link-btn" @click="cancelEdit">Cancelar</button>
          </div>
        </div>
        <div class="post-caption" v-else-if="photo.caption">
          <b>{{ photo.uploader || 'Anónimo' }}</b>{{ photo.caption }}
        </div>

        <div class="post-footer">
          <div class="post-date">{{ new Date(photo.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) }}</div>
          <div class="post-footer-actions" v-if="editingFilename !== photo.filename">
            <button class="link-btn" :disabled="busyFilename === photo.filename" @click="startEdit(photo)">Editar</button>
            <button class="link-btn danger" :disabled="busyFilename === photo.filename" @click="deletePhoto(photo)">Eliminar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
