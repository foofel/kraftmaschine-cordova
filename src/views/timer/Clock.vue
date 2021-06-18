<template>
    <div class="w-full h-full">
        <p>the clock</p>
        <p>{{attrs}}</p>
    </div>
</template>

<script>
import { VueNavigationMixin } from '@/components/vuenavigation'

export default {
    name: "Clock",
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
        const test = this.$attrs.setupModel;
        debugger;
    },
    methods: {
    },
	computed: {
        attrs() {
            return this.$attrs.setupModel;
        }
	}
};
</script>

<style lang="scss" scoped>

</style>