<template>
    <div class="w-full h-full flex items-center flex-col">
        <table class="w-full text-lg ">
            <tr><td colspan="3" class="p-3"><div class="w-full border-b border-solid border-white"></div></td></tr>
            <tr class="">
                <td id="r0" class="w-1 default-indicator visible"></td>
                <td colspan="2">
                    <div class="w-full h-40 flex justify-center items-center text-2xl font-light">
                        <table>
                            <tr>
                                <td class="w-24">Timer: </td>
                                <td>Basic 7s/5s</td>
                            </tr>
                            <tr>
                                <td>Board:</td>
                                <td>Kraftmaschine</td>
                            </tr>
                        </table>
                    </div>
                </td>
            </tr>
            <tr><td colspan="3" class="p-3"><div class="w-full border-b border-solid border-coolGray-400"></div></td></tr>
            <tr>
                <td id="r1" class="default-indicator visible"></td>
                <td class="w-20 pl-3">Tare</td>
                <td class="pr-4">
                    <div class="p-1 w-full h-20 border-solid rounded-md border-2 border-coolGray-200">
                        <WeightCalibrateGraph :opts="opts.tare" />
                    </div>
                    <!--div class="p-1 w-full h-20 border-solid rounded-md border-2 border-coolGray-200 flex flex-col justify-end">
                        <div class="w-full h-1 border-b border-solid best-red"></div>
                    </div-->
                </td>
            </tr>
            <tr><td colspan="3" class="p-3"><div class="w-full border-b border-solid border-coolGray-400"></div></td></tr>
            <tr>
                <td id="r2" class="default-indicator visible"></td>
                <td class="pl-3">Weight</td>
                <td class="pr-4">
                    <div v-if="progressState >= 1" class="p-1 w-full h-20 border-solid rounded-md border-2 border-coolGray-200">
                        <WeightCalibrateGraph :opts="opts.tare" />
                    </div>
                    <div v-if="progressState < 1" class="p-1 w-full h-20 border-solid rounded-md border-2 border-coolGray-200 flex flex-col justify-end">
                        <div class="w-full h-1 border-b border-solid best-red"></div>
                    </div>                    
                </td>
            </tr>
            <tr><td colspan="3" class="p-3"><div class="w-full border-b border-solid border-coolGray-400"></div></td></tr>
            <tr>
                <td id="r3" class="default-indicator visible"></td>
                <td class="pl-3">Weight</td>
                <td class="pr-4">
                    <div v-if="progressState >= 2" class="p-1 w-full h-20 border-solid rounded-md border-2 border-coolGray-200">
                        <WeightCalibrateGraph :opts="opts.tare" />
                    </div>
                    <div v-if="progressState < 2" class="p-1 w-full h-20 border-solid rounded-md border-2 border-coolGray-200 flex flex-col justify-end">
                        <div class="w-full h-1 border-b border-solid best-red"></div>
                    </div>                    
                </td>
            </tr>
        </table>
        <div class="mt-4 w-80 h-10 rounded-lg flex justify-center items-center text-white text-xl font-light skip-button">
            Skip
        </div>
    </div>
</template>

<script>
import { VueNavigationMixin } from '@/components/vuenavigation';
import WeightCalibrateGraph from '@/components/timer/WeightCalibrateGraph.vue'

export default {
    name: "CalibrateView",
    mixins: [VueNavigationMixin],
    components: {
        WeightCalibrateGraph
    },
    data: function() {
        return {
            progressState: 0,
            opts: {
                tare: {
                    name: 'tare',
                    duration: 2
                },
                weightRaw: {
                    name: 'raw',
                    duration: 2
                },
                weightWeight: {
                    name: 'weightend',
                }
            }
        }
    },
    mounted() {
    },
    methods: {
    }
}
</script>

<style lang="scss" scoped>
.default-indicator {
    background-color: #EB4343;
    opacity: 0;
    transition: 0.1s all ease-in;
    &.visible{
        opacity: 1;
    }
}
.skip-button {
    background: rgb(235,67,67);
    background: linear-gradient(115deg, rgba(235,67,67,1) 85%, rgba(247,89,89,1) 85%);
}
.best-red {
    //background-color: #EB4343;
    border-color: #EB4343;
}
</style>