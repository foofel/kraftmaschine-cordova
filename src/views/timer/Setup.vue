<template>
    <HeadlineView headlineText="Timer Setup">
        <router-view :setupModel="this.$attrs.setupModel"/>
    </HeadlineView>
</template>

<script>
import HeadlineView from '@/components/HeadlineView2'
import { VueNavigationMixin } from '@/core/util/vuenavigation'
export default {
    name: "Setup",
    mixins: [VueNavigationMixin],
    components: {
        HeadlineView
    },
    data: function() {
        return {};
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