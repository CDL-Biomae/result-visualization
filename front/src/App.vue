<template>
  <div id="app">
    <navbar/>
    <router-view />
  </div>
</template>

<script>
import Navbar from '@/navbar'
export default {
  components: {Navbar}
};
</script>

<style lang="css">
@import "style/style.css";
</style>
