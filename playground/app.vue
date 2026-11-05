<script setup lang="ts">
import { shallowRef } from "vue";
import { useObjectUrl } from "#imports";

const isCropperOpen = shallowRef(false);
const avatarFile = shallowRef<File | null>(null);
// VueUse releases previous previews and the final URL when the playground unmounts.
const avatarPreview = useObjectUrl(avatarFile);

function handleAvatarCrop(result: ImageCropperResult): void {
  avatarFile.value = result.file;
  // Upload belongs to the consuming application: await uploadAvatar(result.file).
}
</script>

<template>
  <main class="playground">
    <h1>Nuxt Image Cropper</h1>
    <p>Native controls, rose colors, and no required CSS framework.</p>
    <ImageCropperPreview :src="avatarPreview ?? null" shape="circle" :size="112" />
    <button type="button" class="playground__open" @click="isCropperOpen = true">
      Choose profile picture
    </button>
    <ImageCropperDialog
      v-model:open="isCropperOpen"
      preset="avatar"
      output-mime-type="image/webp"
      :output-quality="0.9"
      :output-width="512"
      :output-height="512"
      :max-size="5 * 1024 * 1024"
      @confirm="handleAvatarCrop"
    />
  </main>
</template>

<style scoped>
/* The playground owns its page layout; the module only styles its components. */
.playground {
  display: grid;
  justify-items: center;
  align-content: center;
  min-height: 70vh;
  gap: 1.5rem;
  padding: 2rem;
  font-family: system-ui, sans-serif;
}

.playground h1,
.playground p { margin: 0; text-align: center; }

.playground__open {
  padding: 0.75rem 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: oklch(58.6% 0.253 17.585);
  color: white;
  font: inherit;
  cursor: pointer;
}

.playground__open:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
</style>
