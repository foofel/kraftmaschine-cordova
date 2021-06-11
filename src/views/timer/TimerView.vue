<template>
    <div class="w-full h-full">
        <router-view :setupModel="setupModel"></router-view>
    </div>
</template>

<script>
import { VueNavigationMixin } from '@/components/vuenavigation'

export default {
    name: "TimerView",
    mixins: [VueNavigationMixin],
    components: {
    },
    data: function() {
        return {
            setupModel: { 
                timer: null,
             }
        };
    },
    mounted: function() {
        // set initial page stack route
    },
    methods: {
    },
	computed: {
	}
};
</script>

<style lang="scss" scoped>

</style>