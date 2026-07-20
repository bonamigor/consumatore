<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] })
</script>

<template>
  <div>
    <UiPageHeader
      title="Painel de Administração"
      description="Acesse os cadastros e operações do sistema"
    />
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <NuxtLink
        v-for="item in [
          { to: '/admin/pedidos', title: 'Pedidos', desc: 'Listar e acompanhar pedidos', icon: 'lucide:clipboard-list' },
          { to: '/admin/empresas', title: 'Empresas', desc: 'Dados usados nas notas', icon: 'lucide:building-2' },
          { to: '/admin/clientes', title: 'Clientes', desc: 'Cadastro de clientes', icon: 'lucide:users' },
          { to: '/admin/produtos', title: 'Produtos', desc: 'Catálogo de produtos', icon: 'lucide:package' },
          { to: '/admin/unidades', title: 'Unidades', desc: 'Unidades de medida', icon: 'lucide:ruler' },
          { to: '/admin/estantes', title: 'Estantes', desc: 'Estantes e estoque', icon: 'lucide:layout-grid' },
          { to: '/admin/usuarios', title: 'Usuários', desc: 'Acessos e perfis', icon: 'lucide:user-cog' },
          { to: '/admin/relatorios', title: 'Relatórios', desc: 'Vendas, compras e indicadores', icon: 'lucide:bar-chart-3' },
        ]"
        :key="item.to"
        :to="item.to"
        class="card flex items-center gap-4 p-6 transition-all hover:border-brand-300 hover:shadow-md"
      >
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
          <Icon :name="item.icon" class="h-6 w-6" />
        </div>
        <div>
          <h3 class="font-bold text-gray-900">{{ item.title }}</h3>
          <p class="text-sm text-gray-600">{{ item.desc }}</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
