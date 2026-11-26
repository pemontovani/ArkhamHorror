<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

</script>
<template>
  <div class="page-container">
    <div class="page-content column">
      <section class="column">
        <h2 class="title">{{ t('about.copyrightTitle') }}</h2>
        <div class="box column">
          <p v-html="t('about.copyrightBody')"></p>

          <p>{{ t('about.copyrightArtwork') }}</p>
        </div>
      </section>
      <section class="column">
        <h2 class="title">{{ t('about.projectTitle') }}</h2>

        <div class="box" v-html="t('about.projectBody')"></div>
      </section>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 768px) {
  .page-content {
    width: 100%;
    padding: 20px 12px 10px;
    box-sizing: border-box;
  }
}
</style>
