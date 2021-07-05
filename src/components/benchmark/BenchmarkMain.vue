<template>
    <div class="center-in-rows fill-parent page">
        <div v-if="state === 0" class="fill-parent center-only">
            <div class="content center-in-rows">
                <p class="headline">Introduction</p>
                <p class="text">
                    The Competition mode allows you to compare yourself with other users. 
                    You can test your hangtime, max weight and hold size. Depending on
                    your perfor-mance you will be ranked accordingly in the Highscore. The Highscore 
                    features multiple modi e.g. overall hangtime or best in the last week, max absolute or relative weight
                    over 7 seconds etc. If you reach certain goals these acomplish-ments then will add to your perk list. 
                </p>
                <Button :disabled="!exclusiveAccessAllowed" class="btn" @onClick="onStart()">START</Button>
                <a href="javascript:void(0)" @click="onForceEnd()">Force end Benchmark</a>
            </div>
        </div>        
        <HeadlineView v-if="state === 1" headlineText="Competition">
            <BenchmarkSetup  @setupDone="onSetupDone" />
        </HeadlineView>
        <Benchmark v-if="state === 2" :setupData="setupData" :highscoreData="highscoreData" @restartBenchmark="onRestartBenchmark()" ref="benchmark" />
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Route } from 'vue-router';
import BenchmarkSetup from '@/components/benchmark/BenchmarkSetup.vue'
import Benchmark from '@/components/benchmark/Benchmark.vue'
import HeadlineView from '@/components/HeadlineView.vue'
import Button from '@/components/Button.vue'
import { BenchmarkSetupData, HighscoreEntry } from '../typeexports';
import { VueNavigation } from '@/core/util/vuenavigation';
import { EasyRemoteApiHelpers, RemoteAPI, showToast } from '../../core/util';

@Component({
    components: {
        BenchmarkSetup,
        Benchmark,
        Button,
        HeadlineView
    }/*,
    beforeRouteLeave (to:Route, from:Route, next:Function) {
        let self = this as BenchmarkMain;
        let lr = self.canLeaveComponent();
        if(lr === "ok") {
            no point _> ask
            start point -> toast msg
            finished -> ask
        } else {
            next();
        }
    }*/
})
export default class BenchmarkMain extends VueNavigation {
    state = 0;
    backend: RemoteAPI;
    //setupData:BenchmarkSetupData|null = null;
    setupData: any = JSON.parse('{"tareWeights":{"left":0,"right":0,"combined":0},"selectedHolds":{"left":{"id":9,"complementary":12,"name":"Edge 20","shortName":"E20","type":"edge","defaultHand":"l","depth":20,"fingers":4,"pos":{"x":12.5,"y":90},"size":{"x":100,"y":25}},"right":{"id":12,"complementary":9,"name":"Edge 20","shortName":"E20","type":"edge","defaultHand":"r","depth":20,"fingers":4,"pos":{"x":387.5,"y":90},"size":{"x":100,"y":25}},"board":{"id":1,"name":"Twinpeaks Reference","width":750,"height":180,"holds":[{"id":1,"complementary":4,"name":"Jug","shortName":"Jug","type":"jug","defaultHand":"l","depth":50,"fingers":5,"pos":{"x":0,"y":160},"size":{"x":125,"y":20}},{"id":2,"complementary":5,"name":"40° Sloper","shortName":"S40","type":"sloper","defaultHand":"l","depth":50,"fingers":5,"pos":{"x":125,"y":138},"size":{"x":125,"y":42}},{"id":3,"complementary":6,"name":"45° Sloper","shortName":"S45","type":"sloper","defaultHand":"l","depth":50,"fingers":5,"pos":{"x":250,"y":130},"size":{"x":125,"y":50}},{"id":4,"complementary":1,"name":"Jug","shortName":"Jug","type":"jug","defaultHand":"r","depth":50,"fingers":5,"pos":{"x":375,"y":160},"size":{"x":125,"y":20}},{"id":5,"complementary":2,"name":"40° Sloper","shortName":"S40","type":"sloper","defaultHand":"r","depth":50,"fingers":5,"pos":{"x":500,"y":138},"size":{"x":125,"y":42}},{"id":6,"complementary":3,"name":"45° Sloper","shortName":"S45","type":"sloper","defaultHand":"r","depth":50,"fingers":5,"pos":{"x":625,"y":130},"size":{"x":125,"y":50}},{"id":7,"complementary":8,"name":"Pocket","shortName":"Pkt","type":"pocket","defaultHand":"l","depth":20,"fingers":3,"pos":{"x":27.5,"y":130},"size":{"x":70,"y":25}},{"id":8,"complementary":7,"name":"Pocket","shortName":"Pkt","type":"pocket","defaultHand":"r","depth":20,"fingers":3,"pos":{"x":402.5,"y":130},"size":{"x":70,"y":25}},{"id":9,"complementary":12,"name":"Edge 20","shortName":"E20","type":"edge","defaultHand":"l","depth":20,"fingers":4,"pos":{"x":12.5,"y":90},"size":{"x":100,"y":25}},{"id":10,"complementary":13,"name":"Edge 25","shortName":"E25","type":"edge","defaultHand":"l","depth":25,"fingers":4,"pos":{"x":137.5,"y":90},"size":{"x":100,"y":25}},{"id":11,"complementary":14,"name":"Edge 30","shortName":"E30","type":"edge","defaultHand":"l","depth":30,"fingers":4,"pos":{"x":262.5,"y":90},"size":{"x":100,"y":25}},{"id":12,"complementary":9,"name":"Edge 20","shortName":"E20","type":"edge","defaultHand":"r","depth":20,"fingers":4,"pos":{"x":387.5,"y":90},"size":{"x":100,"y":25}},{"id":13,"complementary":10,"name":"Edge 25","shortName":"E25","type":"edge","defaultHand":"r","depth":25,"fingers":4,"pos":{"x":512.5,"y":90},"size":{"x":100,"y":25}},{"id":14,"complementary":11,"name":"Edge 30","shortName":"E30","type":"edge","defaultHand":"r","depth":30,"fingers":4,"pos":{"x":637.5,"y":90},"size":{"x":100,"y":25}},{"id":15,"complementary":18,"name":"Edge 10","shortName":"E10","type":"edge","defaultHand":"l","depth":10,"fingers":4,"pos":{"x":12.5,"y":50},"size":{"x":100,"y":25}},{"id":16,"complementary":19,"name":"Edge 12","shortName":"E12","type":"edge","defaultHand":"l","depth":12,"fingers":4,"pos":{"x":137.5,"y":50},"size":{"x":100,"y":25}},{"id":17,"complementary":20,"name":"Edge 15","shortName":"E15","type":"edge","defaultHand":"l","depth":15,"fingers":4,"pos":{"x":262.5,"y":50},"size":{"x":100,"y":25}},{"id":18,"complementary":15,"name":"Edge 10","shortName":"E10","type":"edge","defaultHand":"r","depth":10,"fingers":4,"pos":{"x":387.5,"y":50},"size":{"x":100,"y":25}},{"id":19,"complementary":16,"name":"Edge 12","shortName":"E12","type":"edge","defaultHand":"r","depth":12,"fingers":4,"pos":{"x":512.5,"y":50},"size":{"x":100,"y":25}},{"id":20,"complementary":17,"name":"Edge 15","shortName":"E15","type":"edge","defaultHand":"r","depth":15,"fingers":4,"pos":{"x":637.5,"y":50},"size":{"x":100,"y":25}},{"id":21,"complementary":24,"name":"Crimp 4","shortName":"C4","type":"crimp","defaultHand":"l","depth":4,"fingers":4,"pos":{"x":12.5,"y":10},"size":{"x":100,"y":25}},{"id":22,"complementary":25,"name":"Crimp 6","shortName":"C6","type":"crimp","defaultHand":"l","depth":6,"fingers":4,"pos":{"x":137.5,"y":10},"size":{"x":100,"y":25}},{"id":23,"complementary":26,"name":"Crimp 8","shortName":"C8","type":"crimp","defaultHand":"l","depth":8,"fingers":4,"pos":{"x":262.5,"y":10},"size":{"x":100,"y":25}},{"id":24,"complementary":21,"name":"Crimp 4","shortName":"C4","type":"crimp","defaultHand":"r","depth":4,"fingers":4,"pos":{"x":387.5,"y":10},"size":{"x":100,"y":25}},{"id":25,"complementary":22,"name":"Crimp 6","shortName":"C6","type":"crimp","defaultHand":"r","depth":6,"fingers":4,"pos":{"x":512.5,"y":10},"size":{"x":100,"y":25}},{"id":26,"complementary":23,"name":"Crimp 8","shortName":"C8","type":"crimp","defaultHand":"r","depth":8,"fingers":4,"pos":{"x":637.5,"y":10},"size":{"x":100,"y":25}}],"officialBenchmarkHolds":{"left":9,"right":12}}},"userWeight":37.80400000000006}');
    highscoreData: Array<HighscoreEntry> = [];
    exclusiveAccessAllowed = false;
    intervall: any = null;

    constructor() {
        super();
        this.backend = this.$root.$data.backend;
    }

    async mounted() {
        this.getHighscoreData();
        this.intervall = setInterval(async () => {
            if(this.state !== 0) {
                return;
            }
            this.checkCanStartBenchmark();
        }, 2000);
        this.checkCanStartBenchmark();
        //this.state = 2;
    }

    async checkCanStartBenchmark() {
        const current = await EasyRemoteApiHelpers.getCurrentExclusiveBenchmarkAccess(this.backend);
        console.log(current);
        if(current !== false && current.userId === -1) {
            this.exclusiveAccessAllowed = true;
            console.log("access allowed");
        } else {
            this.exclusiveAccessAllowed = false;
            console.log("access denied");
        }  
    }

    beforeDestroy() {
        if(this.intervall) {
            clearInterval(this.intervall);
        }
    }

    async getHighscoreData() {
        const highscores = await EasyRemoteApiHelpers.getReferenceHighscore(this.backend, "time");
        for(const hs of highscores) {
            const hsEntry: HighscoreEntry = {
                id: hs.id,
                rank: parseInt(hs.rank),
                percentile: hs.percentile_rank,
                userWeight: hs.user_weight,
                hangWeight: hs.hang_weight,
                activeTime: hs.active_time,
                insertDate: hs.insert_date,
                userId: hs.user_id,
                userAlias: hs.user_alias,
                userName: hs.user_name,
                boardId: hs.board_id,
                boardName: hs.board_name,
                leftId: hs.left_hand_id,
                leftDepth: hs.left_hold_depth,
                leftName: hs.left_hold_name,
                rightId: hs.right_hand_id,
                rightDepth: hs.right_hold_depth,
                rightName: hs.right_hold_name
            };
            this.highscoreData.push(hsEntry);
        }
        //this.state = 2;
    }

    async onStart() {
        const request = await EasyRemoteApiHelpers.requestExclusiveBenchmarkAccess(this.backend);
        //TODO: now we need to keep the exclusive access alive
        if(request && request.error === 0) {
            this.state = 1;
        } else {
            showToast(`unable to get exclusive access: ${request.result}`);
        }
    }
    async onForceEnd() {
        const kick = window.confirm("This will kick someone out of their current Benchmark. Do this only if you are physically at the board and see it is not in use. The user will know who kicked him, do you want to continue?");
        if(kick) {
            console.log("kick");
            const request = await EasyRemoteApiHelpers.forceEndExclusiveBenchmarkAccess(this.backend);
            if(request.error === 0) {
                showToast("forcefully ended benchmark");
            } else {
                showToast(`unable to end benchmark: ${request.result}`);
            }

        } else {
            console.log("dont kick");
        }
    }

    onSetupDone(setupData: any) {
        this.setupData = setupData;
        this.state = 2;
    }

    canLeaveComponent() {
        if(this.state !== 2){
            return "ok";
        }
        const bm = this.$refs.benchmark as Benchmark;
        if(bm) {
            if(bm.canAskForLeave()) {
                return "ask";
            } else {
                //return "block";
                return "ask";
            }
        }
        return "ask";
    }

    onBeforeShowDialog() { }

    onRestartBenchmark() {
        this.state = 0;
        this.setupData = null;
    }
}
</script>

<style lang="scss" scoped>
.page {
    .content {
        margin: auto;
        .headline {
            font-size: 2em;
            font-weight: 300;
            font-style: italic;
            margin-top: 0;
        }
        .text {
            width: 80%;
            text-align: left;
            font-weight: 300;
            //font-style: italic;
            /*overflow-wrap: break-word;
            word-wrap: break-word;
            hyphens: auto;*/
        }
        .btn {
            margin-top: 30px;
            width: 100px;
        }
    }
}
</style>