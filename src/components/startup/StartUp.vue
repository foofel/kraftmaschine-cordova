<template>
<div class="h-screen w-screen" id="startup">
    <div class="h-screen w-screen flex justify-center ">
        <div class="w-5/6 mt-24">
            <div class="flex justify-center items-center h-12 kraftmaschine">
                KRAFTMASCHINE
            </div>
            <router-view />
        </div>
    </div>
    <div class="highlight"></div>
</div>
</template>

<script>
import "@/assets/styles/tailwind.css"
export default {
    name: "StartUp",
    components: {},
    data: function() {
        return {};
    },
    mounted: function() {},
    methods: {
    },
	computed: {
	}
};
</script>

<style lang="scss">
.kraftmaschine {
    font-family: Boldini;
    font-size: 2.7em;
}

.highlight {
    $angle: 27.5deg;
    $offset: 20%;
    position: fixed;
    width: 150px;
    height: 1340px;
    top: 50%;
    left: 50%;
    transform-origin: center center;
    transform: 
        rotate($angle) 
        translate(0%, -$offset) 
        rotate(-$angle) 
        translate(-50%, -50%) 
        rotate($angle);
    background: linear-gradient(180deg, #FF0000 0%, rgba(255, 255, 255, 0) 100%);
    z-index: -1;
}
</style>