<template>
    <HeadlineView headlineText="Timer">
        <router-view :setupModel="setupModel"/>
    </HeadlineView>
</template>

<script>
import HeadlineView from '@/components/HeadlineView2'
import { VueNavigationMixin } from '@/components/vuenavigation'
export default {
    name: "TimerView",
    mixins: [VueNavigationMixin],
    components: {
        HeadlineView
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