<template>
    <HeadlineView headlineText="Guided Training">
        something
    </HeadlineView>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { VueNavigation } from '../vuenavigation';
import HeadlineView from '@/components/HeadlineView.vue'

@Component({
    components: {
        HeadlineView
    }
})
export default class TrainPlanView extends VueNavigation {
    constructor(){
        super();
    }
    mounted() {}
    beforeDestroy() {}
}
</script>

<style lang="scss" scoped>

</style>