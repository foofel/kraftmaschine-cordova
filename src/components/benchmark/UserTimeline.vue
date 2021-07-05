<template>
    <div class="root center-in-rows fill-parent">
        <div class="ray-container">
            <div class="line">
                <div class="circle left"></div>
                <div class="circle right"></div>
            </div>
            <div class="times center-in-columns">
                <div class="left">0s</div>
                <div class="middle"></div>
                <div class="right">{{maxTime.toFixed(0)}}s</div>
            </div>
        </div>
        <div class="names-container">
            <div class="list-sizer">
                <div v-for="(user, index) in getUsers" 
                    v-bind:key="user.pos"
                    :style="getMaxTimeStyle(user, index)"
                    class="name-container center-in-rows">
                    <div class="details">
                        <div class="center-in-columns">
                            <div class="text">{{user.name}}</div>
                            <div class="position">#{{user.pos}}</div>
                        </div>
                        <div class="text">{{user.time}} s</div>
                    </div>
                    <div class="arrow">🠇</div>
                </div>
            </div>
        </div>
        <div class="own-name-container">
            <div class="sizer">
                <div class="own-name center-in-rows" :style="getOwnStyle()">
                    <div class="arrow">🠅</div>
                    <div class="details">
                        <div class="text">You: {{elapsedTime.toFixed(2)}} s</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="place-container"></div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { clamp, map } from '../../core/util/math';

interface User {name: string; pos: number; time: number }

@Component({
    components: {
    }
})
export default class UserTimeline extends Vue {
    @Prop({default: 0}) elapsedTime!: number;
    users: Array<User> = [{name:'Albert',pos:0,time:0.7843},{name:'Cheri',pos:1,time:2.7952},{name:'Angeline',pos:2,time:5.4864},{name:'Owen',pos:3,time:6.4195},{name:'Bowman',pos:4,time:8.0973},{name:'Sanders',pos:5,time:11.4575},{name:'Darla',pos:6,time:12.9217},{name:'Wells',pos:7,time:15.1552},{name:'Hardy',pos:8,time:16.7045},{name:'Celeste',pos:9,time:18.8037},{name:'Everett',pos:10,time:21.2013},{name:'Bradford',pos:11,time:23.975},{name:'Marsha',pos:12,time:25.0425},{name:'Strong',pos:13,time:27.2537},{name:'Mclean',pos:14,time:29.3284},{name:'Della',pos:15,time:31.333},{name:'Odessa',pos:16,time:32.4593},{name:'Leta',pos:17,time:34.5522},{name:'Angelita',pos:18,time:37.7589},{name:'Malone',pos:19,time:39.7551},{name:'Austin',pos:20,time:41.2935},{name:'Claudia',pos:21,time:42.3257},{name:'Tommie',pos:22,time:44.6924},{name:'Gilliam',pos:23,time:46.8108},{name:'Meadows',pos:24,time:48.2655},{name:'Jocelyn',pos:25,time:51.8617},{name:'Vonda',pos:26,time:53.4417},{name:'Lucy',pos:27,time:54.4514},{name:'Anthony',pos:28,time:57.4054},{name:'Maureen',pos:29,time:58.1574},{name:'Bernard',pos:30,time:60.6768},{name:'Harrell',pos:31,time:62.7856},{name:'Bettye',pos:32,time:64.8404},{name:'Pamela',pos:33,time:67.2568},{name:'Trisha',pos:34,time:68.5088},{name:'Jessica',pos:35,time:70.2026},{name:'Riddle',pos:36,time:73.5509},{name:'West',pos:37,time:75.2418},{name:'Lee',pos:38,time:77.6854},{name:'Aguirre',pos:39,time:78.4622},{name:'Beverly',pos:40,time:81.333},{name:'Lottie',pos:41,time:83.0115},{name:'Mueller',pos:42,time:85.3888},{name:'Raymond',pos:43,time:87.6181},{name:'Antoinette',pos:44,time:89.4897},{name:'Loraine',pos:45,time:90.8356},{name:'Douglas',pos:46,time:92.3405},{name:'Blake',pos:47,time:94.9745},{name:'Kasey',pos:48,time:96.6797},{name:'Rasmussen',pos:49,time:99.8302}];
    /*users:Array<User> = [
        { name: "Nora", pos: 1, time: 34.37 },
        { name: "Ber", pos: 2, time: 30.89 },
        { name: "Hans", pos: 3, time: 25.75 },
        { name: "Gustav", pos: 4, time: 25.94 },
        { name: "Bernhard", pos: 5, time: 21.22 },
        { name: "Hannelore", pos: 6, time: 19.37 },
        { name: "Uwe", pos: 7, time: 18.64 },
        { name: "Peter", pos: 8, time: 18.52 },
        { name: "Lisa", pos: 9, time: 14.27 }
    ];*/
    ownBest: User = { name: "Jakob", pos: 1, time: 15 };
    rayExtension = 1.2;
    constructor(){
        super();
    }
    mounted() {
    }
    get maxTime() {
        return Math.max(this.elapsedTime * this.rayExtension, 3);
    }
    get getUsers() {
        return this.users;
    }
    getMaxTimeStyle(user: User) {
        const pos = Math.min(user.time / this.maxTime, 1)
        return {
            left: `${pos * 100}%`
        };
    }
    getOwnStyle() {
        const pos = 1 / this.rayExtension;
        return {
            left: `${pos * 100}%`
        };
    }
    getCurrentPlace() {

    }
}
</script>

<style lang="scss" scoped>
.root {
    position:absolute;
}

.ray-container {
    width: calc(100% - 10px);
    position: absolute;

    .line {
        position: absolute;
        width: calc(100% - 10px);
        left: 5px;
        height: 0;
        border: 1px solid gray;

        .circle {
            position: absolute;
            background-color: gray;
            border-radius: 50%;
            width: 10px;
            height: 10px;
            top: -5px;
        }

        .left {
            left: -5px;
        }

        .right {
            right: -5px;
        }        
    }

    .times {
        position: absolute;
        width: 100%;
        margin-top: 10px;
        .left {
            font-weight: 400;
        }
        .middle {
            flex-grow: 1;
        }
        .right {}
    }
}

.names-container {
    position: absolute;
    width: calc(100% - 10px);
    margin-left: 1px;

    .list-sizer {
        position: relative;
        left: 5px;
        width: calc(100% - 10px);
    }
}

.name-container {
    position: absolute;
    left: 0;
    transform: translate(-50%, -100%);

    .details {
        font-size: 0.75em;
        font-weight: 300;
        background-color: honeydew;
        border-radius: 5px;
        border: 1px solid lightgray;
        max-width: 100px;
        padding: 2px;
    }

    .text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: center;
    }

    .position {
        margin-left: 3px;
    }

    .arrow {}
}

.own-name-container {
    position: absolute;
    width: calc(100% - 10px);
    margin-left: 1px;

    .sizer {
        position: relative;
        left: 5px;
        width: calc(100% - 10px);        

        .own-name {
            @extend .name-container;
            left: 0;
            transform: translate(-50%, 0%);
            .details {
                .text {
                    min-width: 60px;
                    font-weight: bold;
                }
            }

            .arrow {}
        }
    }
}

.place-container {
    position: absolute;
    bottom: 0px;
}
</style>