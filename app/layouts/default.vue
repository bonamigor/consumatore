<script setup lang="ts">
const mobileOpen = ref(false)
const route = useRoute()

watch(() => route.fullPath, () => {
  mobileOpen.value = false
})
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <div class="hidden lg:flex">
      <AppSidebar />
    </div>

    <!-- Mobile sidebar -->
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-40 lg:hidden"
    >
      <div class="absolute inset-0 bg-black/40" @click="mobileOpen = false" />
      <div class="relative z-10 h-full w-72">
        <AppSidebar />
      </div>
    </div>

    <main class="flex flex-1 flex-col overflow-hidden">
      <header class="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <button class="btn-ghost p-2" type="button" @click="mobileOpen = true">
          <Icon name="lucide:menu" class="h-5 w-5" />
        </button>
        <span class="font-bold text-gray-900">Sistema de Pedidos</span>
      </header>
      <div class="flex-1 overflow-y-auto">
        <div class="p-6 md:p-8">
          <slot />
        </div>
      </div>
    </main>
  </div>
</template>
