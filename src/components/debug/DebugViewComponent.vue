<template>
    <div class="page">
        <!--textarea class="text" v-model="textString" ref="ta"></textarea-->
        <div class="graph-container" @click="startConnect">
            <BenchmarkGraph ref="graph" />
        </div>        
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { VueNavigation } from '../vuenavigation';
import BenchmarkGraph from '@/components/benchmark/BenchmarkGraph.vue'
import { WeightMessage } from '@/core/sensorreader';
import { BluetoothLE } from './bluetoothle'
import { CordovaBluetoothLE } from './cordova-bluetoothle'
import { WebBluetoothLE } from './web-bluetoothle'
//import WC from '@/components/hangboardtimer/WeightCalibration.vue'

@Component({
    components: {
        //WC
        BenchmarkGraph
    }
})
export default class DebugViewComponent extends VueNavigation {
    interval: any = null;
    textString = "init;"
    textData: Array<string> = [];
    timeBuffer: Array<number> = [];
    weightBuffer: Array<number> = [];
    gradientBuffer: Array<number> = [];
    //textArea!:HTMLTextAreaElement;
    benchmarkGraph!: BenchmarkGraph;
    bufferLengthSeconds = 3600;
    stopUpdate = false;
    ble:BluetoothLE|null = null;

    constructor() {
        super();
        if(window.hasOwnProperty("cordova")) {
            this.ble = new CordovaBluetoothLE("NimBLE", "24:6F:28:7B:A5:BE");
        } else {
            this.ble = new WebBluetoothLE();
        }        
    }

    async startConnect() {
        if(this.ble) {
            await this.ble.connect("24:6F:28:7B:A5:BE");
            /*const looper = () => {
                const skipCount = 10;
                let count = skipCount;
                const loop = () => {
                    if(this.stopUpdate) {
                        return;
                    }
                    count++;
                    if(count >= skipCount) {
                        if(this.benchmarkGraph) {
                            this.benchmarkGraph.setData(this.timeBuffer, this.weightBuffer, this.gradientBuffer, []);
                        }
                        count = 0;
                    }
                    requestAnimationFrame(loop);
                };
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(looper); */
            this.ble.subscribe("24:6F:28:7B:A5:BE", (data:string) => {
                // cut off w|t at the beginning
                const weightData:Array<string> = data.substr(1).split(" ");
                if(weightData.length < 4) {
                    return;
                }
                const wm = new WeightMessage(+weightData[2], +weightData[3], (+weightData[2]) + (+weightData[3]), (+weightData[1]), false);
                this.injectWeightMessage(wm);
            });
            const doRedraw = () => {
                if(this.benchmarkGraph) {
                    this.benchmarkGraph.setData(this.timeBuffer, this.weightBuffer, this.gradientBuffer, []);
                }
                if(this.stopUpdate) {
                    return;
                }
                setTimeout(() => {
                    requestAnimationFrame(doRedraw);
                }, 1000)
            }
            requestAnimationFrame(doRedraw)
        }
    }

    injectWeightMessage(wm:WeightMessage) {
        this.timeBuffer.push(wm.ts / 1000000);
        this.weightBuffer.push(wm.combined);                    
        const endIdx = this.timeBuffer.length - 1;
        if(this.timeBuffer.length === 1) {
            this.gradientBuffer.push(0);
        } else {
            const tDiff = (this.timeBuffer[endIdx] - this.timeBuffer[endIdx - 1]);
            const wGrad = (this.weightBuffer[endIdx] - this.weightBuffer[endIdx - 1]) / tDiff;
            this.gradientBuffer.push(wGrad);
        }
        const bufferDurationSeconds = (this.timeBuffer[this.timeBuffer.length - 1] - this.timeBuffer[0]);
        let count = 0;
        if(bufferDurationSeconds > this.bufferLengthSeconds) {
            const latestTime = this.timeBuffer[this.timeBuffer.length - 1];
            for(; count < this.timeBuffer.length; count++) {
                const sampleAge = latestTime - this.timeBuffer[count];
                if(sampleAge > this.bufferLengthSeconds) {
                    continue;
                }
                break;
            }
        }
        if(count > 0) {
            this.timeBuffer.splice(0, count);
            this.weightBuffer.splice(0, count);
            this.gradientBuffer.splice(0, count);
        }
    }

    mounted() {
        //this.textArea = this.$refs.ta as HTMLTextAreaElement;
        this.benchmarkGraph = this.$refs.graph as BenchmarkGraph;
        const bluetoothle: any = (window as any).bluetoothle;
        this.startConnect();
        /*if(bluetoothle) {
            bluetoothle.initialize((e:any) => { 
                console.log(e); 
            }, { "request": true, "statusReceiver": false, "restoreKey" : "bluetoothleplugin" });
            setTimeout(() => {
                bluetoothle.disconnect((e:any) => console.log(e), (e:any) => console.log(e), {
                    "address": "24:6F:28:7B:A5:BE"
                });                
            }, 1000);
            setTimeout(() => {
                bluetoothle.close((e:any) => console.log(e), (e:any) => console.log(e), {
                    "address": "24:6F:28:7B:A5:BE"
                });                
            }, 2000);
            setTimeout(() => {
                bluetoothle.connect((e:any) => console.log(e), (e:any) => console.log(e), {
                    "address": "24:6F:28:7B:A5:BE"
                });                
            }, 3000);
            setTimeout(() => {
                bluetoothle.discover((e:any) => console.log(e), (e:any) => console.log(e), {
                    "address": "24:6F:28:7B:A5:BE",
                    "clearCache": true
                });           
            }, 4000);
            setTimeout(() => {
                bluetoothle.mtu((e:any) => console.log(e), (e:any) => console.log(e), {
                    "address": "24:6F:28:7B:A5:BE",
                    "mtu" : 50
                });            
            }, 5000);
            setTimeout(() => {
                bluetoothle.subscribe((e:any) => {
                    if(!e.hasOwnProperty('value')) {
                        return;
                    }
                    const recvData:string = atob(e.value);
                    //console.log(recvData);
                    const weightData:Array<string> = recvData.split(" ");
                    if(weightData.length < 4) {
                        return;
                    }
                    //console.log(this, this.timeBuffer, this.weightBuffer, this.gradientBuffer);
                    let wm = new WeightMessage(+weightData[2], +weightData[3], (+weightData[2]) + (+weightData[3]), (+weightData[1]), false);
                    this.timeBuffer.push(wm.ts / 1000000);
                    this.weightBuffer.push(wm.combined);                    
                    let endIdx = this.timeBuffer.length - 1;
                    if(this.timeBuffer.length === 1) {
                        this.gradientBuffer.push(0);
                    } else {
                        let tDiff = (this.timeBuffer[endIdx] - this.timeBuffer[endIdx - 1]);
                        let wGrad = (this.weightBuffer[endIdx] - this.weightBuffer[endIdx - 1]) / tDiff;
                        this.gradientBuffer.push(wGrad);
                    }
                    let bufferDurationSeconds = (this.timeBuffer[this.timeBuffer.length - 1] - this.timeBuffer[0]);
                    let count = 0;
                    if(bufferDurationSeconds > this.bufferLengthSeconds) {
                        let latestTime = this.timeBuffer[this.timeBuffer.length - 1];
                        for(; count < this.timeBuffer.length; count++) {
                            let sampleAge = latestTime - this.timeBuffer[count];
                            if(sampleAge > this.bufferLengthSeconds) {
                                continue;
                            }
                            break;
                        }
                    }
                    if(count > 0) {
                        this.timeBuffer.splice(0, count);
                        this.weightBuffer.splice(0, count);
                        this.gradientBuffer.splice(0, count);
                    }
                }, (e:any) => console.log(e), {
                    "address": "24:6F:28:7B:A5:BE",
                    "service": "181d",
                    "characteristic": "1234"
                });                  
            }, 6000);
            setTimeout(() => {
                /setInterval(() => {
                    if(this.benchmarkGraph) {
                        this.benchmarkGraph.setData(this.timeBuffer, this.weightBuffer, this.gradientBuffer, []);
                    }
                }, 30);/
                const loop = () => {
                    if(this.stopUpdate) {
                        return
                    }
                    if(this.benchmarkGraph) {
                        //this.benchmarkGraph.setData(this.timeBuffer, this.weightBuffer, this.gradientBuffer, []);
                    }
                    requestAnimationFrame(loop);
                };
                requestAnimationFrame(loop);
                
            }, 7000);
            /setTimeout(() => {
                this.interval = setInterval(() => {
                    bluetoothle.read((e:any) => {
                        let val = atob(e.value);
                        this.textData += val + "\n";
                        this.textArea.scrollTop = this.textArea.scrollHeight;
                    }, (e:any) => console.log(e), {
                        "address": "24:6F:28:7B:A5:BE",
                        "service": "181d",
                        "characteristic": "1234"
                    });            
                }, 1000);
            }, 10000);/
        }*/
    }

    beforeDestroy() {
        this.stopUpdate = true;
        if(this.interval) {
            clearInterval(this.interval);
        }
        const bluetoothle: any = (window as any).bluetoothle;
        if(bluetoothle) {
            bluetoothle.unsubscribe((e: any) => console.log(e), (e: any) => console.log(e), {
                "address": "24:6F:28:7B:A5:BE",
                "service": "181d",
                "characteristic": "1234"
            });
        }
    }
}
</script>

<style lang="scss" scoped>
.page {
    width: 100vw;
    height: 100vh;
    box-sizing: border-box;
    padding: 20px;
}
.text {
    width: 100%;
    height: 100%;
}
.graph-container {
    width: 100%;
    height: 100%;
}
</style>