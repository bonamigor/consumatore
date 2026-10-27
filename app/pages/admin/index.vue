<script setup lang="ts">
// A antiga página "Administração" só repetia os itens do menu; o endereço leva ao Início
// para não quebrar favoritos.
definePageMeta({ middleware: ['auth', 'admin'], redirect: '/' })
</script>

<template>
  <div />
</template>
