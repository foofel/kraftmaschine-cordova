<template>
    <div class="fill-parent">
        <div class="fill-parent page">
            <div class="headline" >{{headlineText}}</div>
            <div class="content">
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
.page {
    > .headline {
        position: relative;
        //background-color: rgba(255, 230, 0, 0.897);
        background: linear-gradient(to bottom,#fade52 0%, #fade52 100%);
        //color: white;
        width: 100%;
        font-size: 1.5em;
        font-weight: 400;
        text-align: center;
        height: 50px;
        line-height: 50px;
        box-shadow: 0px 0px 1px 0px rgba(0,0,0,0.5);
        z-index: 1;
        font-style: italic;
    } 
    > .content {
        position: relative;
        height: calc(100% - 50px);
        width: 100%;
        overflow-y:auto;
    }
}
</style>