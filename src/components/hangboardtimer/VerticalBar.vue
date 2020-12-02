<template>
    <div class="container" ref="container" >
        <div class="passive"></div>
        <div class="active" :style="activeStyle"></div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class CustomBar extends Vue {
    @Prop({default: 0.25}) value!: number;
    @Prop({default: "lightgray"}) passiveColor!: string;
    @Prop({default: "linear-gradient(0deg, rgba(0,180,0,1) 10%, rgba(0,220,0,1))"}) activeColor!: string;
    direction = "width";
    mounted() {
        const cnt = this.$refs.container as HTMLElement;
        if(cnt) {
            const rkt = cnt.getBoundingClientRect();
            if(rkt.height > rkt.width) {
                this.direction = "height";
            }
        }
    }

    get activeStyle() {
        const value = Math.max(Math.min(this.value, 1), 0);
        return `${this.direction}: ${100 * value}%;`;
    }
}
</script>

<style lang="scss" scoped>
.container {
    position: relative;
    width: 100%;
    height: 100%;
    min-width: 5px;
    min-height: 5px;
    .passive {
        position: absolute;
        background-color: #dcdcdc;
        width: 100%;  
        height: 100%;
    }
    .active {
        position: absolute;
        //background: linear-gradient(0deg, rgba(0,180,0,1) 10%, rgba(0,220,0,1));
        background-color: #63b916;
        width: 100%;
        height: 100%;
        bottom: 0;
        left: 0;
    }
}
</style>