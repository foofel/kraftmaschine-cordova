<template>
    <div class="w-full h-full">
        <!--router-view /> < !-- :setupModel="setupModel" -->
        <MyRouter ref="myRouter" :myRouter="{ name: 'lol', router: $refs.myRouter }"></MyRouter>
    </div>
</template>

<script>
import { VueNavigationMixin } from '@/components/vuenavigation'
import MyRouter from '@/components/myrouter/MyRouter';

export default {
    name: "TimerView",
    mixins: [VueNavigationMixin],
    components: {
        MyRouter
    },
    data: function() {
        return {
            setupModel: { 
                timer: null,
             }
        };
    },
    mounted: function() {
        debugger;
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