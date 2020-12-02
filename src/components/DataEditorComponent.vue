<template>
    <div class="fill-parent page">
        <HeadlineView :headlineText="modelCopy.title">
            <div class="content center-in-rows">
                <table class="table">
                    <tr class="item" v-for="(item, propName) in modelCopy.model" v-bind:key="propName">
                        <td class="label">{{item.displayName}}</td>
                        <td class="data">
                            <div v-if="item.edit === 'text'">
                                <input class="input" type="text" :placeholder="propName" v-model="item.value"/>
                            </div>
                            <div v-else-if="item.edit === 'checked'">
                                <toggle-button v-model="item.value"/>
                            </div>
                            <div v-else-if="item.edit === 'number'">
                                <input class="input" type="number" :placeholder="propName" v-model.number="item.value"/>
                            </div>                            
                            <div v-if="item.validate && !item.validate(item.value)" class="validate-fail">{{item.validateMessage}}</div>
                            <div class="desc">{{item.desc}}</div>
                        </td>
                    </tr>
                </table>
                <div class="vline"></div>
                <div class="buttons center-in-columns">
                    <Button @onClick="onAbort()">Abort</Button>
                    <Button class="margin" @onClick="onSave()">Save</Button>
                </div>
            </div>
        </HeadlineView>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import Button from '@/components/Button.vue'
import HeadlineView from './HeadlineView.vue'
import { DataModelComponentDataInterface } from './typeexports';
import cloneDeep from 'lodash/cloneDeep';
import ToggleButton from 'vue-js-toggle-button'
Vue.use(ToggleButton);

@Component({
    components: {
        HeadlineView,
        Button
    }
})
export default class DataEditorComponent extends Vue {
    @Prop({default: () => { return { title: "default", model: {}}}}) model!: DataModelComponentDataInterface;
    modelCopy: DataModelComponentDataInterface|null = null;

    created() {
        this.modelCopy = cloneDeep(this.model);
    }

    onAbort() {
        this.$emit("onAbort");
    }

    onSave() {
        this.$emit("onSave", this.modelCopy!.model);
    }
}
</script>

<style lang="scss" scoped>
.page {
    .content {
        padding: 20px;
        .table {
            .item {
                .label{
                    width: 1%;
                    white-space: nowrap;
                    padding-right: 10px;;
                }
                .data{
                    .validate-fail {
                        margin-top: 0px;
                        margin-bottom: 5px;
                        color: red;
                        font-size: 0.8em;
                    }
                    .desc {
                        margin-top: 2px;
                        font-size: 0.75em;
                    }
                }
                td {
                    padding-bottom: 1em;
                }
            }
        }
    }
    .vline {
        width: 100%;
        height: 10px;
        border-bottom: 1px solid lightgray;
    }
    .buttons {
        width: 100%;
        margin: 20px;
        .margin{
            margin-left: 50px;
        }
    }
}
</style>