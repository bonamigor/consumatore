<template>
  <div class="flex items-center justify-center py-16">
    <div class="flex items-center gap-3 text-gray-500">
      <Icon name="lucide:loader-2" class="h-6 w-6 animate-spin" />
      <span>{{ $slots.default ? '' : 'Carregando...' }}</span>
      <slot />
    </div>
  </div>
</template>
