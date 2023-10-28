<template>
  <div id="app">
    <SignBoardTest/>
  </div>
</template>

<script>
import SignBoardTest from './components/SignBoardTest'

export default {
  name: 'App',
  components: {
    SignBoardTest
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
}
html, body, #app {
  width: 100%;
  height: 100%;
}
</style>
