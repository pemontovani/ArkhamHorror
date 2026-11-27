<script setup lang="ts">
/* The frame shared by the signed-out pages: sign in, sign up and the two halves
 * of a password reset. The cover art fills the page with the form to its left,
 * clear of the investigator; on a phone the art sits on top and the form under
 * it. */
import KeyArt from '@/components/KeyArt.vue'
import logo from '@/assets/art/logo.webp'
</script>

<template>
  <div class="auth">
    <KeyArt class="auth-art" />
    <div class="auth-panel">
      <img class="auth-logo" :src="logo" alt="Arkham Horror: The Card Game" />
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.auth-art {
  position: absolute;
  inset: 0;
  z-index: -1;

  /* Darkens the side the form is on, so it reads over any part of the picture. */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(8, 8, 14, 0.75) 0%, rgba(8, 8, 14, 0) 55%);
  }
}

.auth-panel {
  /* Auto margins centre the panel, and let it scroll from its top rather than
     lose it on a screen too short to hold it. */
  margin: auto 0 auto clamp(16px, 6vw, 120px);
  width: min(400px, calc(100% - 32px));
  box-sizing: border-box;
  padding: 24px 16px 16px;
  background: rgba(14, 16, 28, 0.86);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  color: var(--title);
}

/* One readable size for the submit button on all four pages. */
.auth-panel :deep(button) {
  font-size: 0.95rem;
  font-weight: 700;
}

.auth-logo {
  display: block;
  width: min(280px, 80%);
  height: auto;
  margin: 0 auto 12px;
}

@media (max-width: 768px) {
  .auth-art {
    position: relative;
    inset: auto;
    z-index: 0;
    flex: none;
    height: min(62.5vw, 42vh);

    /* Fades the foot of the picture into the page behind the logo. */
    &::after {
      background: linear-gradient(180deg, transparent 55%, var(--background) 100%);
    }
  }

  .auth-panel {
    position: relative;
    margin: -48px auto 16px;
    padding: 0 6px;
    background: transparent;
    border: 0;
    box-shadow: none;
    backdrop-filter: none;
  }

  .auth-logo {
    width: min(240px, 62%);
    filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.6));
  }
}
</style>
