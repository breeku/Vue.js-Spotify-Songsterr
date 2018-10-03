<template>
  <v-content>
    <Main/>
  </v-content>
</template>
<script>
import Main from './components/Main.vue'

export default {
  name: 'app',
  components: {
    Main
  }
}
</script>
<style>
Main {
  min-height: 100vh;
  max-height: 100%;
  background: radial-gradient(ellipse at bottom, #1b2735 0%,#090a0f 100%);
  background-repeat: cover;
  font-family: 'Roboto', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #d9e1e9;
}
</style>
