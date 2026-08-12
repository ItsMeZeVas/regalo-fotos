<script setup>
import { ref, onMounted } from 'vue'
import UploadForm from './components/UploadForm.vue'
import Gallery from './components/Gallery.vue'

const refreshKey = ref(0)

function onUploaded() {
  // Fuerza a la galería a recargar fotos.json tras subir una nueva
  refreshKey.value++
}
</script>

<template>
  <div class="app">
    <header>
      <h1>Nosotros ❤️</h1>
    </header>
    <UploadForm @uploaded="onUploaded" />
    <Gallery :key="refreshKey" />
  </div>
</template>
