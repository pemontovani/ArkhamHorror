<script setup lang="ts">
/* The cover illustration, filling whatever box it is put in. Phones get a
 * tighter crop on the investigator and the creature: the full picture is three
 * times as wide as it is tall, and would shrink to a strip.
 *
 * Decoration, so it has no alt text. `--art-position` moves the crop. */
import desktopArt from '@/assets/art/key-art.webp'
import mobileArt from '@/assets/art/key-art-mobile.webp'
</script>

<template>
  <picture class="key-art">
    <source media="(max-width: 768px)" :srcset="mobileArt" />
    <img :src="desktopArt" alt="" />
  </picture>
</template>

<style scoped>
.key-art {
  display: block;
}

img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: var(--art-position, center);
}
</style>
