<template>
    <div class="w-full h-full flex flex-col">
        <div class="w-full header-height headline-bg flex justify-center items-center bg-white text-white text-2xl font-light">{{headlineText}}</div>
        <div class="w-full content-height overflow-y-scroll">
            <div class="w-full h-full">
                <slot></slot>
            </div>
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
.header-height {
    height: 3.5rem;
}
.content-height {
    height: calc(100vh - 3.5rem);
}
</style>