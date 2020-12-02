<template>
    <div class="fill-parent page">
        <div class="headline">Friends</div>
        <div class="scroller">
            <div class="content center-in-rows">
                hi there :) (friends)
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { VueNavigation } from '../vuenavigation';

@Component({
    components: {
    }
})
export default class FriendsView extends VueNavigation {
    channel = "";
    constructor(){
        super();
    }
    mounted() {}
    beforeDestroy() {}
}
</script>

<style lang="scss" scoped>
.page {
    .headline {
        background-color: #FDD835;
        width: 100%;
        font-size: 1.5em;
        font-weight: 600;
        text-align: center;
        height: 50px;
        line-height: 50px;
        box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.5);
        z-index: 1;
    } 
    .scroller {
        overflow-y: auto;
        height: calc(100% - 50px);
        .content {
            margin-top: 10px;
            margin-bottom: 10px;
        }
    }
}
</style>