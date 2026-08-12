<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { EXTRA_MESSAGE_TITLE, EXTRA_MESSAGE_BODY } from '../config.js'

const bubbleVisible = ref(false)
const modalOpen = ref(false)
let showTimer = null
let hideTimer = null

function scheduleBubble() {
  // aparece cada tanto, en un intervalo aleatorio entre ~40s y ~90s
  const delay = 40000 + Math.random() * 50000
  showTimer = setTimeout(() => {
    bubbleVisible.value = true
    // si no la tocan, se esconde sola a los 12s y se vuelve a programar
    hideTimer = setTimeout(() => {
      bubbleVisible.value = false
      scheduleBubble()
    }, 12000)
  }, delay)
}

function openMessage() {
  clearTimeout(hideTimer)
  bubbleVisible.value = false
  modalOpen.value = true
}

function closeMessage() {
  modalOpen.value = false
  scheduleBubble()
}

onMounted(() => {
  scheduleBubble()
})
onUnmounted(() => {
  clearTimeout(showTimer)
  clearTimeout(hideTimer)
})
</script>

<template>
  <button
    v-if="bubbleVisible"
    class="news-bubble"
    aria-label="Mensaje especial"
    @click="openMessage"
  >📰</button>

  <div v-if="modalOpen" class="modal-overlay" @click.self="closeMessage">
    <div class="modal-card">
      <button class="modal-close" aria-label="Cerrar" @click="closeMessage">✕</button>
      <div class="modal-ribbon">ESPECIAL</div>
      <div class="modal-title">{{ EXTRA_MESSAGE_TITLE }}</div>
      <div class="modal-body">{{ EXTRA_MESSAGE_BODY }}</div>
    </div>
  </div>
</template>
