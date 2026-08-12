<script setup>
import { ref } from 'vue'
import UploadForm from './components/UploadForm.vue'
import Gallery from './components/Gallery.vue'
import FloatingMessage from './components/FloatingMessage.vue'
import { MASTHEAD_TOPLINE, MASTHEAD_HEADLINE } from './config.js'

const refreshKey = ref(0)

function onUploaded() {
  refreshKey.value++
}
</script>

<template>
  <div class="app">
    <header>
      <div class="topline">{{ MASTHEAD_TOPLINE }}</div>
      <img class="masthead-img" src="/masthead-logo.png" alt="RECUERDOS" />
      <div class="subtitle">{{ MASTHEAD_HEADLINE }}</div>
    </header>
    <UploadForm @uploaded="onUploaded" />
    <Gallery :key="refreshKey" />
    <FloatingMessage />
  </div>
</template>
