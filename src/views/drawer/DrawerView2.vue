<template>
    <div id="drawer" class="w-screen h-screen flex flex-col">
        <div class="notch-helper bg-blue-300"></div>
        <div class="flex flex-col flex-1">
            <div v-if="!isConnected" @click="connectionMenuClicked()" class="notification-container center-only bg-red-600">
                No device connection :(
            </div>
            <div class="flex-1">
                <vue-page-stack>
                    <router-view ref="routeView" />
                </vue-page-stack>
            </div>
        </div>
        <div class="drawer-click-catcher" :class="{'active': visible}" @click="overlayClicked($event)"></div>
        <div class="drawer flex flex-col" :class="{'visible': visible}" @click="hideDrawer()">
            <div class="h-14"></div>
            <div class="overflow-y-scroll flex-1">
                <div class="ml-5 flex flex-col text-4xl font-light p-0 w-9/12">
                    <div class="">Scale</div>
                    <div class="h-2"></div>
                    <div class="h-px divider"></div>
                    <div class="h-2"></div>
                    <div>Timer</div>
                    <div class="h-2"></div>
                    <div>Logbook</div>
                    <div class="h-2"></div>
                    <div class="h-px divider"></div>
                    <div class="h-2"></div>
                    <div>Benchmark</div>
                    <div class="h-2"></div>
                    <div>Results</div>
                    <div class="h-2"></div>
                    <div>Rankings</div>
                    <div class="h-2"></div>
                    <div class="h-px divider"></div>
                    <div class="h-2"></div>
                    <div>Friends</div>
                    <div class="h-2"></div>
                    <div>Profile</div>
                    <div class="h-2"></div>
                    <div>Users</div>
                    <div class="h-2"></div>
                    <div class="h-px divider"></div>
                    <div class="h-2"></div>
                    <div>Options</div>
                    <div class="h-2"></div>
                    <div>Boards</div>
                    <div class="h-2"></div>
                    <div class="h-px divider"></div>
                    <div class="h-2"></div>
                    <div>Debug</div>
                </div>
            </div>
        </div>
        <div class="absolute top-5 left-5 text-2xl" @click="toggleDrawer()">
            <img src="@/assets/drawer/burger.svg" width="22" height="18" >
        </div>
    </div>
</template>

<script>

const myNav = {
    methods: {
        canLeaveComponent() {
            return "ok";
        },
        onBeforeShowDialog(){}
    }
}

import "@/assets/styles/tailwind.css"
import { VueNavigation } from '@/components/vuenavigation'
import { AppContext } from '../../main';

export default {
    name: "DrawerView",
    mixins: [],
    components: {},
    data: function() {
        return {
            isConnected: true,
            visible: true
        };
    },
    created() {},
    mounted() {
        //AppContext.hangboardConnector.registerChannelInfoCallback(this.onChannelInfo);
        //this.isConnected = AppContext.hangboardConnector.isConnected();
    },
    methods: {
        overlayClicked(event) {
            console.log(event)
            event.preventDefault();
            this.visible = false;
        },
        canChange() {
            const currentView = this.$refs.routeView;
            if(currentView) {
                const leaveAction = currentView.canLeaveComponent();
                if(leaveAction === "ask") {
                    currentView.onBeforeShowDialog();
                    const leave = window.confirm("Leave current page?");
                    if(leave) {
                        return true;
                    }
                } else if(leaveAction === "block") {
                    //showToast("Unable to leave, please wait while action in progress", 5000);
                } else {
                    return true;
                }              
            } else {
                return true;
            }
            return false;
        },
        itemClicked(item) {
            const target = `/view/${item}`
            const sameTarget = this.$router.currentRoute.path.startsWith(target);
            if(this.canChange()) {
                if(sameTarget) {
                    this.rndItemKey = Math.random().toString();
                }
                this.$router.replace(item);
            }
        },
        toggleDrawer() {
            this.visible = !this.visible;
        },
        hideDrawer() {
            this.visible = false;
        }        
    },
	computed: {
	}
};
</script>

<style lang="scss" scoped>
.drawer {
    position: absolute;
    left: 0;
    top: 0;        
    height: 100vh;
    width: 75vw;
    max-width: 250px;
    box-sizing: border-box;
    //border: 1px solid lime;
    background: rgba(255, 255, 255, 0.81);
    backdrop-filter: blur(30px);
    transition: transform 0.125s linear, opacity 0.125s linear;
    opacity: 0;
    will-change: transform;
    transform: translate(-100%, 0);
    &.visible {
        transition: transform 0.125s linear, opacity 0.125s linear;
        transform: translate(0, 0);
        opacity: 1;
        border-right: 1px solid lightgray;
    }
}
.drawer-click-catcher {
    position: absolute;
    left: 0;
    top: 0;        
    height: 100vh;
    width: 100vw;
    pointer-events: none;
    //background-color: lightsalmon;
    transform: translate(-100%, 0);
    &.active {
        transform: translate(0, 0);
        pointer-events: all;
    }
}
.divider {
    background-color: #F07979;
}
.notch-helper {
    //height: env(safe-area-inset-top);
    height: var(--notch-inset-top);
}
</style>