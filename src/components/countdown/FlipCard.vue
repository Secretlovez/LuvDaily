<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  val: string | number
  color?: string
}>()

const front = ref(props.val)
const back = ref(props.val)
const flipping = ref(false)

watch(() => props.val, (newVal, oldVal) => {
  if (newVal === oldVal) return
  back.value = newVal
  front.value = oldVal
  flipping.value = true
})

function onAnimationEnd() {
  flipping.value = false
  front.value = back.value
}
</script>

<template>
  <div
    class="flip-card"
    :class="{ flipping }"
  >
    <!-- Top Half (Static) -->
    <div class="digital top">
      {{ back }}
    </div>

    <!-- Bottom Half (Static) -->
    <div class="digital bottom">
      {{ front }}
    </div>

    <!-- Flipping Leaf -->
    <div
      class="digital front"
      @animationend="onAnimationEnd"
    >
      {{ front }}
    </div>
    <div class="digital back">
      {{ back }}
    </div>
  </div>
</template>

<style scoped>
.flip-card {
  position: relative;
  display: inline-block;
  width: 5vw;
  height: 8vw;
  background: transparent;
  border-radius: 0.6vw;
  color: v-bind('color || "white"');
  font-size: 6vw;
  line-height: 8vw;
  text-align: center;
  font-family: 'PangMenZhengDao', 'Courier New', Courier, monospace;
  perspective: 400px;
}

.digital {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  overflow: hidden;
  background: transparent;
  box-sizing: border-box;
}

.digital.top,
.digital.front {
  top: 0;
  height: 50%;
  border-radius: 0.6vw 0.6vw 0 0;
  line-height: 8vw; /* Aligns text to show top half */
}

.digital.bottom,
.digital.back {
  top: 50%;
  height: 50%;
  border-radius: 0 0 0.6vw 0.6vw;
  border-top: 0;
  line-height: 0; /* Aligns text to show bottom half */
}

/* The flipping parts */
.digital.front {
  z-index: 2;
  transform-origin: 50% 100%;
  backface-visibility: hidden;
}

.digital.back {
  z-index: 1;
  transform-origin: 50% 0%;
  transform: rotateX(180deg);
  backface-visibility: hidden;
  line-height: 0;
}

.flipping .digital.front {
  animation: flipDownFront 0.3s cubic-bezier(0.455, 0.03, 0.515, 0.955) forwards;
  will-change: transform;
}

.flipping .digital.back {
  animation: flipDownBack 0.3s cubic-bezier(0.455, 0.03, 0.515, 0.955) forwards;
  will-change: transform;
}

@keyframes flipDownFront {
  0% {
    transform: rotateX(0deg);
  }
  100% {
    transform: rotateX(-180deg);
  }
}

@keyframes flipDownBack {
  0% {
    transform: rotateX(180deg);
  }
  100% {
    transform: rotateX(0deg);
  }
}
</style>
