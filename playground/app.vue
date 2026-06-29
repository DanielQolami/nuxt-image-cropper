<script setup lang="ts">
const isCropperOpen = shallowRef(false);
const avatarFile = shallowRef<File | null>(null);
const avatarPreview = shallowRef<string | null>(null);

function handleAvatarCrop(result: ImageCropperResult) {
  avatarFile.value = result.file;

  if (avatarPreview.value) {
    URL.revokeObjectURL(avatarPreview.value);
  }

  avatarPreview.value = result.blob ? URL.createObjectURL(result.blob) : null;

  // Upload belongs here, not inside the image-cropper module.
  // await uploadAvatar(result.file)
}
</script>

<template>
  <div>
    <div>Nuxt module playground!</div>

    <div class="bg-rose-500 h-70">
      <ImageCropperPreview :src="avatarPreview" shape="circle" :size="112" />

      <UButton
        label="Choose profile picture"
        icon="i-lucide-camera"
        @click="isCropperOpen = true"
      >
        Open
      </UButton>
      <ImageCropperDialog
        v-model:open="isCropperOpen"
        preset="avatar"
        output-mime-type="image/webp"
        :output-quality="0.9"
        :output-width="512"
        :output-height="512"
        :max-size="1 * 1024 * 1024"
        @confirm="handleAvatarCrop"
      />
    </div>
  </div>
</template>
