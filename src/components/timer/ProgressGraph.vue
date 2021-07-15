<template>
    <div class="w-full h-full" ref="container">
        <svg :width="svgWidth" :height="svgHeight">
            <rect v-for="(bar, index) in svgData.repBars" v-bind:key="'bar1_' + index"
                :x="bar.overall.x"
                :y="bar.overall.y"
                :width="bar.overall.width" 
                :height="bar.overall.height"
                fill="#E2E2E2">
            </rect>            
            <rect v-for="(bar, index) in svgData.repBars" v-bind:key="'bar2_' + index"
                :x="bar.active.x"
                :y="bar.active.y"
                :width="bar.active.width" 
                :height="bar.active.height"
                fill="#88E93B">
            </rect>
            <rect v-for="(bar, index) in svgData.repBars" v-bind:key="'bar3_' + index"
                :x="bar.passive.x"
                :y="bar.passive.y"
                :width="bar.passive.width" 
                :height="bar.passive.height"
                fill="#EB4343">
            </rect>            
            <line v-for="(line, index) in svgData.setLines" v-bind:key="'setline_' + index"
                :x1="line.x1"
                :y1="line.y1"
                :x2="line.x2"
                :y2="line.y2"
                stroke="#A0A0A0"
                stroke-width="2">
            </line>
            <line v-for="(line, index) in svgData.timeLines" v-bind:key="'timeline_' + index"
                :x1="line.x1"
                :y1="line.y1"
                :x2="line.x2"
                :y2="line.y2"
                stroke="#A0A0A0"
                stroke-opacity="0.37"
                stroke-width="2">      
            </line>      
            <text v-for="(line, index) in svgData.timeLines" v-bind:key="'text1_' + index"
                :x="line.x1 - 5"
                :y="line.y1"
                text-anchor="end"
                dominant-baseline="middle"
                class="font-medium text-sm">
                {{parseFloat((line.value).toFixed(1))}}s
            </text>
            <text v-for="(rep, index) in svgData.axisLabelRepNumber" v-bind:key="'text2_' + index"
                :x="rep.x"
                :y="rep.y + 3"
                :text-anchor="rep.anchor"
                dominant-baseline="hanging"
                class="font-medium text-sm">
                {{rep.rep}}
            </text>            
        </svg>
    </div>
</template>

<script>
export default {
    name: "ProgressGraph",
    data() {
        return {
            barContainerBB: new DOMRect(),
            progressData: {
                sets: []
            },
            svgData: {
                repBars: [],
                setLines: [],
                timeLines: [],
                axisLabelRepNumber: [],
                maxTime: 0,
                barHeight: 0
            }
        }
    },
    mounted() {
        window.addEventListener('resize', this.onResize);
        // same as onresize but it seem wee ned a longer delay?!
        setTimeout(() => {
            this.updateContainerRect();
            this.rebuildSvgData();
        }, 100);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.onResize);
    },    
    methods: {        
        updateData(progressData) {
            this.progressData = progressData;
            this.rebuildSvgData();
        },
        onResize() {
            // we first ned to set the svg height 0 zero to allow the parent container to shrink back
            // to its height if the container shrunk, otherwise the svg stops the parent container from
            // shrinking, then we can recauculate the actual svg size
            this.barContainerBB = new DOMRect();
            this.$nextTick(() => {
                this.updateContainerRect();
                this.rebuildSvgData();
            });
        },        
        updateContainerRect() {
            this.barContainerBB = this.$refs.container.getBoundingClientRect();
        },
        rebuildSvgData() {
            const svgData = {
                repBars: [],
                setLines: [],
                timeLines: [],
                axisLabelRepNumber: [],
                maxTime: 0,
                barHeight: 0
            }
            const calculateDatasetInfo = () => {
                let currentRep = 0;
                let maxTime = 0;
                for(let i = 0; i < this.progressData.sets.length; i++) {
                    const set = this.progressData.sets[i];
                    for(let k = 0; k < set.length; k++) {
                        currentRep++;
                        maxTime = Math.max(maxTime, set[k].length);
                    }
                }
                return [currentRep, maxTime];
            }
            const [repCount, maxTime] = calculateDatasetInfo();
            const setCount = this.progressData.sets.length;
            if(repCount == 0 || this.barContainerBB.height <= 0 || this.barContainerBB.width <= 0) {
                this.svgData = svgData;
                return;
            }
            const barSpacing = 4;
            const startX = 40; // this is the space we need for the time label on the y axis
            const endX = this.barContainerBB.width;
            const startY = 8; // this is the top spacing we need for the top (heighest) time label on the y axis as the line starts in the middle of the text
            const endY = this.barContainerBB.height - 17; // this is the height needed for the x legend (rep) numbers
            const availableWidth = (endX - startX) - ((setCount - 2) * barSpacing); // -2 for set count works pixel perfect but i have no idea why, should be -1....
            const widthPerBar = availableWidth / repCount;
            const barWidth = widthPerBar - barSpacing;
            const barHeight = endY - startY;
            let currentRep = 0;
            let currentX = startX;
            for(let i = 0; i < setCount; i++) {
                const set = this.progressData.sets[i];
                svgData.axisLabelRepNumber.push({
                    x: currentX,
                    y: endY,
                    rep: currentRep + 1,
                    anchor: "start"
                });                
                for(let k = 0; k < set.length; k++) {
                    const rep = set[k];
                    const overallLength = barHeight * (rep.length / maxTime)
                    const activeLength = barHeight * (rep.active / maxTime)
                    const passiveLength = barHeight * (rep.passive / maxTime)
                    svgData.repBars.push({ 
                        overall: {
                            x: currentX,
                            y: startY + (barHeight - overallLength),
                            width: barWidth,
                            height: overallLength,
                        },
                        active: {
                            x: currentX,
                            y: startY + (barHeight - activeLength),
                            width: barWidth,
                            height: activeLength,
                        },
                        passive: {
                            x: currentX,
                            y: startY + (barHeight - passiveLength - activeLength),
                            width: barWidth,
                            height: passiveLength,
                        }
                    });
                    currentRep++;
                    currentX = currentX + barWidth + barSpacing;
                    if(currentRep == repCount - 1) {
                        svgData.axisLabelRepNumber.push({
                            x: currentX + barWidth,
                            y: endY,
                            rep: currentRep + 1,
                            anchor: "end"
                        });
                    }                    
                }
                if(i < setCount - 1) {
                    const linex = currentX ;
                    currentX = currentX + barSpacing;                    
                    svgData.setLines.push({
                        x1: linex,
                        x2: linex,
                        y1: startY,
                        y2: endY
                    });
                }
            }           
            svgData.timeLines = [
                { x1: startX, x2: endX, y1: endY - 1, y2: endY - 1, value: 0 },
                { x1: startX, x2: endX, y1: startY + barHeight * 0.5, y2: startY + barHeight * 0.5, value: maxTime * 0.5 },
                { x1: startX, x2: endX, y1: startY + 1, y2: startY + 1, value: maxTime }
            ];
            svgData.maxTime = maxTime;
            svgData.barHeight = barHeight;
            this.svgData = svgData;
        }          
    },
    computed: {
        svgWidth() {
            return this.barContainerBB.width;
        },
        svgHeight() {
            return this.barContainerBB.height;
        }
    }
}
</script>

<style lang="scss" scoped>
</style>