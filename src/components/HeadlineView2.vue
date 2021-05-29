<template>
    <div class="w-full h-full flex flex-col">
        <div class="w-full h-14 headline-bg flex justify-center items-center text-white text-2xl font-light">{{headlineText}}</div>
        <div class="flex-1">
            <slot></slot>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({
    components: {
    }
})
export default class HeadlineView extends Vue {
    @Prop({default: "#FDD835"}) color!: string;
    @Prop({default: "TÖÖÖÖXT"}) headlineText!: string;
    constructor(){
        super();
    }

    getStyle() {
        return { backgroundColor: this.color };
    }
}
</script>

<style lang="scss" scoped>
.headline-bg {
    background: url(~@/assets/headlineview/headline.svg) center center no-repeat no-repeat;
    box-shadow: 0px 0px 2px 1px rgba(0, 0, 0, 0.25);
}
</style>