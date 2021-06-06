<template>
    <div>
        <component :is="routedComponent" v-bind="$attrs"></component>
    </div>
</template>

<script>
import SelectorView from '@/views/timer/SelectorView.vue'
import CalibrateView from '@/views/timer/CalibrateView.vue'

const routes = {
    "/": SelectorView,
    "/articles": CalibrateView
};

export default {
    name: "MyRouter",
    components: {},
    data: function() {
        return { 
            current: "/" ,
            stack: ["/"]
        };
    },
    mounted: function() {
        window.addEventListener('pushState', () => {

        });
        window.addEventListener('popState', () => {
            
        });        
    },
    beforeDestroy() {
    },
    methods: {
        push(page) {
            this.current = page;
            this.stack.push(page);
        },
        replace(page) {
            this.current = page;            
            this.stack[this.stack.length - 1] = (page);
        },
        setOrigin(page) {
            this.current = page;
            this.stack = [page]
        }
    },
    computed: {
        routedComponent() {
            const cur = this.current;
            return routes[cur];
        }
    },
    watch: {
        $route (to, from){
            console.log(from, to);
            debugger;
        }
    }
};
</script>

<style lang="scss" scoped>
</style>