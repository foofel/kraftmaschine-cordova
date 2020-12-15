<template>
    <div class="main">
        <div v-if="this.channelError" @click="connectionMenuClicked()" class="notification-container">
            you need to reconnect!
        </div>
        <div class="view">
            <!--keep-alive-->
            <vue-page-stack>
                <router-view :key="$route.fullPath + getKey()" ref="routeView" />
            </vue-page-stack>
            <!--/keep-alive-->
            <router-view name="overlay" />
        </div>
        <div class="drawer" :class="{'drawer-active': visible}" @click="hideDrawer()">
            <div class="items">
                <!--div class="channel-error">
                    <div v-if="this.channelError" class="error-bg"></div>
                    <div v-if="this.channelError" class="error-msg center-in-rows">no data from scale</div>
                </div-->                
                <div class="scroll-container">
                    <div class="item clickable" @click="itemClicked('scale')">
                        <i class="fas fa-balance-scale icon"></i><span>Scale</span>
                    </div>
                    <div class="item clickable" @click="itemClicked('timer')">
                        <i class="fas fa-stopwatch icon"></i><span>Hang Timer</span>
                    </div>                    
                    <div class="item clickable deactivated" @click="itemClicked('trainplan')">
                        <i class="fas fa-chart-line icon"></i><span>Guided Training</span>
                    </div>
                    <div class="item clickable" @click="itemClicked('history')">
                        <i class="far fa-chart-bar icon"></i><span>Timer History</span>
                    </div>                                        
                    <div class="item clickable" @click="itemClicked('benchmark')">
                        <i class="fas fa-arrow-alt-circle-up icon"></i><span>Benchmark</span>
                    </div>
                    <div class="item clickable" @click="itemClicked('highscore')">
                        <i class="fas fa-trophy icon"></i><span>Highscore</span>
                    </div>
                    <div class="item clickable deactivated" @click="itemClicked('perks')">
                        <i class="fas fa-medal icon"></i><span>Perks</span>
                    </div>
                    <div class="item clickable" @click="itemClicked('friends')">
                        <i class="fas fa-people-arrows icon"></i><span>Friends</span>
                    </div>                
                    <div class="item clickable" @click="itemClicked('users')">
                        <i class="fas fa-users icon"></i><span>Users</span>
                    </div>
                    <div class="item clickable" @click="itemClicked('account')">
                        <i class="fas fa-user icon"></i><span>Account</span>
                    </div>
                    <div class="item clickable" @click="itemClicked('options')">
                        <i class="fas fa-cogs icon"></i><span>Options</span>
                    </div>
                    <div class="item clickable" @click="itemClicked('debug')">
                        <i class="fas fa-cogs icon"></i><span>Debug</span>
                    </div>
                    <div class="item clickable" @click="itemClicked('connectionSelector')">
                        <i class="fas fa-cogs icon"></i><span>Device</span>
                    </div>                      
                </div>
            </div>
        </div>
        <div class="drawer-click-overlay" :class="{'drawer-click-overlay-active': visible}" @click="overlayClicked($event)"
        ></div>
        <div class="burger-icon clickable" @click="burgerClicked()" :class="{'burger-icon-active': visible}" >
                <span class="fas fa-bars"></span>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Route } from 'vue-router';
import { VueNavigation } from '../components/vuenavigation';
import { showToast } from '../core/util';
import { GlobalStore } from '../main';
import VuePageStack from 'vue-page-stack';
import router from '../router/index'



@Component({
	components: {}  
})
export default class DrawerView extends Vue {
    visible = false;
    itemKey = "";
    rndItemKey = "123";
    keyLookup: Map<string, string> = new Map<string, string>();
    channelError = false;
    constructor() {
        super();
    }

    mounted() {
        GlobalStore.scaleBackend.registerChannelInfoCallback(this.onChannelInfo);
    }

    beforeDestroy() {
        GlobalStore.scaleBackend.removeChannelInfoCallback(this.onChannelInfo);
    }

    onChannelInfo(channel: string, isActive: boolean) {
        this.channelError = !isActive;
    }

    burgerClicked() {
        this.visible = !this.visible;
    }

    hideDrawer() {
        this.visible = false;
    }

    overlayClicked(event: any) {
        console.log(event)
        event.preventDefault();
        this.visible = false;
    }

    routeRnd() {
        return "abc";
    }

    connectionMenuClicked(event: any) {

    }

    canChange() {
        const currentView = this.$refs.routeView as VueNavigation;
        if(currentView) {
            const leaveAction = currentView.canLeaveComponent();
            if(leaveAction === "ask") {
                currentView.onBeforeShowDialog();
                const leave = window.confirm("Leave current page?");
                if(leave) {
                    return true;
                }
            } else if(leaveAction === "block") {
                showToast("Unable to leave, please wait while action in progress", 5000);
            } else {
                return true;
            }              
        } else {
            return true;
        }
        return false;
    }    

    itemClicked(item: string) {
        const target = `/view/${item}`
        const sameTarget = this.$router.currentRoute.path.startsWith(target);
        if(this.canChange()) {
            if(sameTarget) {
                this.rndItemKey = Math.random().toString();
            }
            this.$router.replace(item);
        }
    }

    log(str: string) {
        console.log(str);
    }

    getKey() {
        return this.rndItemKey;
    }
}
</script>

<style lang="scss" scoped>
@keyframes fadeInOut {
  0%   { opacity:1; }
  50%  { opacity:0; }
  100% { opacity:1; }
}
@keyframes fadeInOutHalf {
  0%   { opacity:1; }
  50%  { opacity:0.5; }
  100% { opacity:1; }
}
.main {
	height: 100vh;
    width: 100vw;
    .view {
        height: 100vh;
        width: 100vw;
        overflow: hidden;
    }
    .notification-container {
        position: absolute;
        bottom: 0;
        left: 0;
        z-index: 97;
        //pointer-events: none;
        /*.drawer-blink {
            position: absolute;
            left: 0;
            top: 0;
            width: 3px;
            height: 100%;
            background-color: #ed2828;
            animation: fadeInOut 2s infinite;
            animation-timing-function: ease-in-out;
        }*/
    }
    .burger-icon {
        position: absolute;
        left: 10px;
        top: 10px;
        width: 30px;
        height: 30px;
        //background-color: green;
        color: rgb(73, 80, 87);
        z-index: 101;
        text-align: center;
        line-height: 30px;
        transition: 0.125s all;
        font-size: 1.25em;
    }
    .burger-icon-active {
        color: white;
    }
    .drawer {
        position: absolute;
        left: 0;
        top: 0;    
        height: 100vh;
        width: 75vw;
        max-width: 250px;
        background-color:rgba(55, 58, 71, 1);
        //backdrop-filter: blur(5px);
        box-shadow: none;
        z-index: 100;
        transform: translate(-100%, 0);
        transition: transform 0.125s;
        color: white;
        padding: 20px;
        box-sizing: border-box;
        //display: none;
        will-change: transform;
        .items {
            position: relative;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            overflow-y: hidden;
            .channel-error {
                position: relative;
                height: 40px;
                margin-left: 30px;
                .error-msg {
                    position: absolute;
                    width: 100%;
                    height: 80%;
                }  
                .error-bg {
                    position: absolute;
                    background-color: #ed2828;
                    border-radius: 3px;
                    animation: fadeInOutHalf 2s infinite;
                    animation-timing-function: ease-in-out;                      
                    width: 100%;
                    height: 80%;
                }            
            }
            .scroll-container {
                overflow-y: auto;
                width: 100%;
                height: calc(100% - 40px);
                .item {
                    font-weight: 300;
                    width: 100%;
                    height: 40px;
                    line-height: 40px;
                    font-size: 1.25em;
                    border-bottom: 1px solid gray;
                    .icon {
                        width: 45px;
                        text-align: center;
                    }
                    &:hover {
                        i {
                            color: crimson;
                        }
                    }
                }
                .deactivated {
                    color: gray;
                }
                .item:last-child {
                    border: none;
                }
            }
        }
    }
    .drawer-active {
        transform: translate(0, 0);
        box-shadow: 2px 0px 5px 0px rgba(0,0,0,0.75);
    }
    .drawer-click-overlay {
        position: absolute;
        left: 0;
        top: 0;
        height: 100vh;
        width: 100vw;
        z-index: 99;
        //backdrop-filter: blur(3px);
        opacity: 0;
        transition: 0.125s opacity linear;
        pointer-events: none;
    }
    .drawer-click-overlay-active {
        opacity: 1;
        pointer-events: all;
    }    
}

</style>