<template>
    <div class="page maximize">
        <DataEditorComponent :model="model" @onAbort="onAbort()" @onSave="(data) => onSave(data)" />
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import Button from '@/components/Button.vue'
import { VueNavigation } from './vuenavigation';
import { DataModelComponentDataInterface, DataModelComponentModelInterface, DataModelComponentValueInterface } from './typeexports';
import DataEditorComponent from './DataEditorComponent.vue'
import { ConfigData, ConfigFile } from '../core/storageinterface';
import { HangboardConnector } from '../core/hangboardconnector';
import { showToast } from '../core/util';

@Component({
    components: {
        DataEditorComponent,
        Button
    }
})
export default class ConfigEditorComponent extends VueNavigation {
    model: DataModelComponentDataInterface =  { title: "Options", model: {}};
    scale: HangboardConnector;
    cfg: ConfigFile = this.$root.$data.cfg;

    constructor() {
        super();
        this.scale = this.$root.$data.scaleBackend;
    }

    created() {
        this.model.model = this.buildModel();
    }
    mounted() {
    }

    buildModel(): any {
        return {
            channel: {
                displayName: "Select Board",
                desc: "Select the id of the board you want to use",
                value: this.cfg.options.channel,
                type: "string",
                edit: "text",
                validate: function(val: string) {
                    if(val === "") {
                        return false;
                    } 
                    return true;
                },
                validateMessage: "Board can not be empty"                
            },
            enableBeep: {
                displayName: "Enable Beep",
                desc: "Beep on the last three seconds before the next rep",
                value: this.cfg.options.enableBeep,
                type: "boolean",
                edit: "checked",
                validate: function(val: boolean) {
                    return true;
                }
            }, 
            enableVibrate: {
                displayName: "Enable Vibrate",
                desc: "Vibrate on the last three seconds before the next rep",
                value: this.cfg.options.enableVibrate,
                type: "boolean",
                edit: "checked"
            },
            beepTimeOffset: {
                displayName: "Beep Offset",
                desc: "The beep/vibrate can be out of sync, this offset allows to play the beep earlier (in seconds).",
                value: this.cfg.options.beepTimeOffset,                      
                type: "number",
                edit: "text",
                validate: function(val: number|string) {
                    let check = 0;
                    if(typeof val === "number") {
                        check = val;
                    }
                    else if(typeof val === "string") {
                        const match = val.trim().match(String.raw`^[-+]?[0-9]*\.?[0-9]+$`);
                        if(!match) {
                            return false;
                        }
                        check = parseFloat(val);
                    } else {
                        return false;
                    }
                    return check >= 0 && check <= 0.9;
                },
                validateMessage: "Offset must be a number. It must be in the range [0, 0.9]"
            }
        };
    }

    onAbort() {
        this.$emit("onAbort");
    }

    onSave(model: DataModelComponentModelInterface) {
        this.$emit("onSave", model);
        for(const idx in model) {
            const newObj = model[idx];
            const oldObj = this.model.model[idx];
            if(newObj.value !== oldObj.value) {
                this.onPropertyChanged(idx, newObj, oldObj);
            }
        }
        //SaveConfigObject(this.cfg);
    }

    onPropertyChanged(propName: string, newObj: DataModelComponentValueInterface, oldObj: DataModelComponentValueInterface) {
        console.log(`prop change: ${propName}, from: ${oldObj.value}, to:${newObj.value}`);
        if(propName === "channel") {
            const channel = newObj.value as string || "test";
            if(channel !== "") {
                this.scale.selectDevice(channel);
                showToast(`Board changed to ${channel}`);
            }
        }
        oldObj.value = newObj.value;
        const options = this.cfg.options;
        if(options.hasOwnProperty(propName)) {
            if(newObj.type === "number") {
                options[propName] = parseFloat(newObj.value as string);
            } else if (newObj.type === "boolean") {
                options[propName] = newObj.value;
            } else if (newObj.type === "string") {
                options[propName] = newObj.value as string;
            } else {
                console.log(`unknown type ${newObj.type} for property ${propName}`);
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.page {
    position: absolute;
    left: 0;
    top: 0;
}
</style>