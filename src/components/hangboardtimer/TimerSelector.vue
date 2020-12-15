<template>
    <div class="center-in-rows fill-parent ">
        <div class="enable-scroll" v-if="showCustom">
            <div class="center-in-rows">
                <div class="form-main center-in-rows">
                    <div class="input-container">
                        <div>
                            <select class="fill-example-select" name="exampleselect" @change="onTimerPresetChanged($event.target.value)" >
                                <option key="none" value="">- none -</option>
                                <option disabled>──────────</option>
                                <option v-for="timer in customTimers"
                                    :key="timer.id+timer.name"
                                    :value="timer.id"
                                    :selected="timer.id === lastTimerSelectionId"
                                >
                                    {{timer.name}}
                                </option>                                
                                <option v-if="customTimers.length > 0" disabled>──────────</option>
                                <option v-for="timer in timers" 
                                    :key="timer.id+timer.name" 
                                    :value="timer.id"
                                    :selected="timer.id === lastTimerSelectionId"
                                >
                                    {{timer.name}}
                                </option>
                            </select>
                            <label for="exampleselect">timer</label>
                        </div>
                        <div class="select-seperator"></div>
                        <div>
                            <input class="timer-input" type="number" name="warmup" placeholder="warmup (s)" v-model.number="customTimerData.data.warmup">
                            <label for="warmup">warmup</label>
                        </div>
                        <div>
                            <input class="timer-input" type="number" name="active" placeholder="active (s)"  v-model.number="customTimerData.data.active">
                            <label for="active">active</label>
                        </div>
                        <div>
                            <input class="timer-input" type="number" name="passive" placeholder="passive (s)"  v-model.number="customTimerData.data.passive">
                            <label for="passive">passive</label>
                        </div>
                        <div>
                            <input class="timer-input" type="number" name="repeats" placeholder="repeats (s)"  v-model.number="customTimerData.data.repeats">
                            <label for="repeats">repeats</label>
                        </div>
                        <div>
                            <input class="timer-input" type="number" name="pause" placeholder="pause (s)"  v-model.number="customTimerData.data.pause">
                            <label for="pause">pause</label>
                        </div>
                        <div>
                            <input class="timer-input" type="number" name="sets" placeholder="sets (s)"  v-model.number="customTimerData.data.sets">
                            <label for="sets">sets</label>
                        </div>
                        <div>
                            <input class="timer-input" type="number" name="cooldown" placeholder="cooldown (s)"  v-model.number="customTimerData.data.cooldown">
                            <label for="cooldown">cooldown</label>
                        </div>
                        <div class="select-seperator"></div>
                        <div>
                            <input class="timer-input " type="text" name="name" placeholder="name"  v-model="customTimerData.name">
                            <label for="name">name</label>
                        </div>
                        <div>
                            <input class="timer-input " type="text" name="desc" placeholder="desc"  v-model="customTimerData.desc">
                            <label for="desc">desc*</label>
                        </div>
                    </div>
                    <div class="btns1">
                        <Button class="custom-button-margin" @onClick="toggleCustomTimerView()">Back</Button>
                        <Button class="custom-button-margin" @onClick="onDeleteCurrentSelected()">Delete</Button>
                        <Button class="custom-button-margin" @onClick="updateSelectedCustomTimer()">Update</Button>
                        <Button class="custom-button-margin" @onClick="onSaveNew()">Save</Button>
                    </div>
                    <!--div class="btsn2">

                    </div-->
                </div>
            </div>
        </div>
        <div class="timer-selection" v-if="!showCustom">
            <div
                class="selection-element center-in-rows"
                v-for="timer in customTimers"
                @click="onTimerSelected(timer)"
                :key="timer.id"
                :title="timer.name"
                >
                {{timer.name}}
            </div>
            <div class="select-seperator" v-if="customTimers.length > 0"></div>
            <div
                class="selection-element center-in-rows"
                v-for="timer in timers"
                @click="onTimerSelected(timer)"
                :key="timer.id"
                :title="timer.name"
                >
                {{timer.name}}
            </div>
            <div class="selection-element center-in-rows" @click="toggleCustomTimerView()">Custom Timers</div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { ConfigFile } from '../../core/storageinterface';
import { makeid } from '../../core/util';
import Button from '@/components/Button.vue'
import { TimerSelectorEntry, PredefinedTimers } from '../typeexports';

@Component({
    components: {
        Button
    }
})
export default class TimerSelector extends Vue {
    timers: Array<TimerSelectorEntry> = PredefinedTimers.timers;
    showCustom = false;
    customTimers: Array<TimerSelectorEntry>;
    customTimerData: TimerSelectorEntry = this.getDefaultCustomTimerData() as any;
    lastSelectedTimerEntry: TimerSelectorEntry | null = null;
    lastTimerSelectionId = "";
    cfg: ConfigFile = this.$root.$data.cfg;
    constructor() {
        super();
        this.customTimers = this.cfg.options.savedTimers;
    }
    getDefaultCustomTimerData() {
        return {
            id: "",
            name: "",
            desc: "",
            data: {
                warmup: "",
                active: "",
                passive: "",
                repeats: "",
                pause: "",
                sets: "",
                cooldown: ""
            }
        }
    }
    onTimerPresetChanged(timerId: string) {
        console.log(timerId);
        this.lastTimerSelectionId = timerId;
        const timers = this.getTimerList();
        const timer = timers.find((val, idx) => val.id === timerId);
        if(timer) {
            this.lastSelectedTimerEntry = { ...timer, data: { ...timer.data } };
            this.customTimerData = { ...timer, data: { ...timer.data as any } };
        }
    }
    onTimerSelected(timerEntry: TimerSelectorEntry) {
        this.$emit("timerSelected", timerEntry);
    }
    toggleCustomTimerView() {
        console.log("custom");
        this.showCustom = !this.showCustom;
    }
    onSaveNew() {
        if(this.customTimerData.name === "") {
            alert("timer name must be set");
            return;
        }
        if(!this.validateCustom()) {
            alert("all values but cooldown/warmup must be > 0");
            return;
        }
        const newTimer = { ...this.customTimerData, id: makeid(10) };
        this.customTimers.push(newTimer as any);
        this.cfg.options.savedTimers = this.customTimers;
        this.resetCustomTimerView();
    }
    onDeleteCurrentSelected() {
        const timer = this.customTimers.find((val, idx) => val.id === this.lastSelectedTimerEntry!.id);
        if(timer) {
            if(confirm(`delete timer '${timer.name}'?`)) {
                this.customTimers = this.customTimers.filter((val) => val.id !== timer!.id);
                this.cfg.options.savedTimers = this.customTimers;
                this.customTimerData = { ...PredefinedTimers.default };
                this.resetCustomTimerView();
            }
        } else {
            alert("please select a custom timer first");
        }
    }
    updateSelectedCustomTimer() {
        const timerIdx = this.customTimers.findIndex((val) => val.id === this.lastTimerSelectionId);
        if(timerIdx !== -1) {
            const timer = this.customTimers[timerIdx];
            if(confirm(`update timer '${timer.name}'?`)) {
                this.customTimers[timerIdx] = {...this.customTimerData};
                this.cfg.options.savedTimers = this.customTimers;
            }
        } else {
            alert("please select a custom timer first");
        }
        this.$forceUpdate();
    }
    validateCustom() {
        return  +this.customTimerData.data.warmup >= 0 &&
                +this.customTimerData.data.active > 0 &&
                +this.customTimerData.data.passive > 0 &&
                +this.customTimerData.data.repeats > 0 &&
                +this.customTimerData.data.pause > 0 &&
                +this.customTimerData.data.sets > 0 &&
                +this.customTimerData.data.cooldown >= 0;
    }
    dataChanged() {}
    getTimerList() {
        return [...PredefinedTimers.timers, ...this.customTimers];
    }
    resetCustomTimerView() {
        this.lastTimerSelectionId = "";
        this.lastSelectedTimerEntry = null;
        this.customTimerData = this.getDefaultCustomTimerData() as any;
    }
}
</script>

<style lang="scss" scoped>
.headline {
    font-weight: 300;
    font-size: 2em;
    margin-bottom: 15px;
    margin-top: 15px;
}
.timer-selection {
    width: 80%;
    display: flex;
    align-items: center;
    flex-direction: column;
    font-weight: 300;
}
.selection-element {
    width: 90%;
    min-height: 50px;
    border: 1px solid lightgray;
    border-radius: 5px;
    margin: 5px;
    cursor: pointer;
}
.selection-element:hover {
    background: linear-gradient(to bottom, #4eb5e5 0%,#389ed5 100%);
}
.form-main{
    margin-top: 25px;
    margin-bottom: 25px;
}
.input-container {
    width: 100%;
    padding-left: 15px;
}
.timer-input {
    //width: 70%;
    border-radius: 3px;
    margin: 3px;
    border: 1px solid gray;
    padding: 2px;
    height: 25px;
}
.custom-button-margin {
    margin-top: 15px;
    margin-left: 10px;
}
.fill-example-select {
    width: 66%;
    border-radius: 3px;
    margin: 3px;
    border: 1px solid gray;
    padding: 2px;
    height: 25px;
}
.select-seperator {
    margin-top: 5px;
    margin-bottom: 5px;
    border-top: 1px solid lightgray;
    width: 95%;
    height: 1px;
    min-height: 1px;
}
.enable-scroll{
    overflow-x:hidden; 
    overflow-y:auto;
    height: 95%;
}
.btns1 {
    width: 100%;
}
.btns2 {
    width: 100%;
}
</style>