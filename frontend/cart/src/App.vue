<template>
  <div id="app">
    <Navbar />
    <ToastContainer />
    <CartDrawer />
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue'
import ToastContainer from './components/ToastContainer.vue'
import CartDrawer from './components/CartDrawer.vue'
</script>

<style>
#app {
  min-height: 100vh;
}

main {
  padding-top: 0;
}
</style>
