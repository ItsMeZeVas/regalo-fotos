<script setup>
import { ref, onMounted } from 'vue'
import { RAW_BASE } from '../config.js'

const photos = ref([])
const loading = ref(true)

async function loadPhotos() {
  loading.value = true
  try {
    // cache-busting con timestamp para no recibir una versión vieja cacheada
    const res = await fetch(`${RAW_BASE}/fotos.json?t=${Date.now()}`)
    if (res.ok) {
      const data = await res.json()
      photos.value = data.sort((a, b) => new Date(b.date) - new Date(a.date))
    } else {
      photos.value = []
    }
  } catch (e) {
    photos.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadPhotos)
</script>

<template>
  <div>
    <div v-if="loading" class="empty">Cargando recuerdos...</div>
    <div v-else-if="photos.length === 0" class="empty">
      Todavía no hay fotos. ¡Sube la primera! 📸
    </div>
    <div v-else>
      <div v-for="photo in photos" :key="photo.filename" class="post">
        <div class="post-header">{{ photo.uploader || 'Anónimo' }}</div>
        <img :src="`${RAW_BASE}/fotos/${photo.filename}?t=${Date.now()}`" :alt="photo.caption" loading="lazy" />
        <div class="post-caption" v-if="photo.caption">
          <b>{{ photo.uploader || 'Anónimo' }}</b>{{ photo.caption }}
        </div>
        <div class="post-date">{{ new Date(photo.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) }}</div>
      </div>
    </div>
  </div>
</template>
