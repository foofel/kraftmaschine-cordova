<template>
    <SimpleWeightDisplay rate=5 />
</template>

<script>
// @ is an alias to /src
import SimpleWeightDisplay from '@/components/SimpleWeightDisplay.vue'

export default {
  name: 'SimpleWeight',
  components: {
    SimpleWeightDisplay
  },
  mounted() {
  }, 
  beforeDestroy() {
  }
}
</script>
