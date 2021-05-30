<template>
    <div class="w-full h-full">
        <div class="w-full h-full flex items-center flex-col gap-2 text-2xl font-light">
            <div class="h-14"></div>
            <div
                class="flex items-center w-3/4 button justify-center"
                v-for="timer in timers"
                @click="onTimerSelected(timer)"
                :key="timer.id"
                :title="timer.name"
                >
                {{timer.name}}
            </div>
            <div class="flex justify-center items-center w-3/4 h-14 button" @click="toggleCustomTimerView()">
                <router-link to="edit">Create/Edit</router-link>
            </div>
            <div class="spacer h-2 text-xs">-</div>
        </div>
    </div>
</template>

<script>
import { VueNavigationMixin } from '@/components/vuenavigation';

export default {
    name: "SelectorView",
    mixins: [VueNavigationMixin],
    data: function() {
        return {
            timers: []
        }
    },
    mounted() {
        this.timers = this.$store.timers.timer;
    },
    methods: {
        onTimerSelected(selectedTimer) {
            this.$attrs.setupModel.timer = selectedTimer
            this.$router.replace("")
        }
    }
}
</script>

<style lang="scss" scoped>
.button {
    border: 1px solid lightgray;
    border-radius: 5px;
    min-height: 56px;
}
.spacer {
    color: white;
}
</style>