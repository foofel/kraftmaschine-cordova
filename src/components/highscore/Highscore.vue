<template>
<div id="root" class="fill-parent">
    <div class="fill-parent">
        <div class="headline clickable" @click="reloadHighscore">Highscore</div>
        <div class="scroller">
            <div class="table-container">
                <table class="progress-table">
                    <tbody>
                        <tr class="header-row">
                            <th class="header-cell a first">#</th>
                            <th class="header-cell b">Alias</th>
                            <th class="header-cell c">Time</th>
                            <th class="header-cell d">Weight</th>
                            <th class="header-cell e last">Date</th>
                        </tr>
                    </tbody>
                    <tbody v-for="(entry, index) in highscoreEntries" v-bind:key="index">
                        <tr class="entry-row clickable" @click="(event) => toggleRow(entry)">
                            <td class="entry-cell first">{{index + 1}}</td>
                            <td class="entry-cell">{{entry.data.userAlias}}</td>
                            <td class="entry-cell">{{entry.data.activeTime.toFixed(2)}}s</td>
                            <td class="entry-cell">
                                {{entry.data.hangWeight.toFixed(2)}}kg
                                ({{(entry.data.hangWeight / entry.data.userWeight * 100).toFixed(2)}}%)
                            </td>
                            <td class="entry-cell last">{{getDate(entry)}}</td>
                        </tr>
                        <tr v-if="entry.showDetails" class="detail-row">
                            <td colspan="5" class="detail-cell">
                                <div class="detail-view">
                                    <div class="padding-container">
                                        <div class="grid-container">
                                            <div class="grid-item place">
                                                <div class="item-title">Place</div>
                                                <div><span class="hash">#</span>{{index + 1}}</div>
                                            </div>
                                            <div class="grid-item name">
                                                <div class="item-title">Name</div>
                                                <div class="name-box">
                                                    <div v-if="entry.data.userName" class="name">{{entry.data.userName}}</div>
                                                    <div v-else class="alias">-</div>
                                                </div>
                                            </div>
                                            <div class="grid-item validity">
                                                <div class="item-title">Valid Times</div>
                                                <div class="times">
                                                    <div class="time" :class="{ hide: entry.data.activeTime < 3 }">&gt;3</div>
                                                    <div class="time" :class="{ hide: entry.data.activeTime < 5 }">, &gt;5</div>
                                                    <div class="time" :class="{ hide: entry.data.activeTime < 7 }">, &gt;7</div>
                                                    <div class="time" :class="{ hide: entry.data.activeTime < 10 }">, &gt;10</div>
                                                </div>
                                            </div>
                                            <div class="grid-item type">
                                                <div class="item-title">Type</div>
                                                <div v-if="entry.data.leftId == 9 && entry.data.rightId == 12" class="official">official</div>
                                                <div v-else class="custom">custom</div>
                                            </div>
                                            <div class="grid-item time">
                                                <div class="item-title">Time</div>
                                                <div>{{entry.data.activeTime.toFixed(2)}}s</div>
                                            </div>
                                            <div class="grid-item user-weight">
                                                <div class="item-title">User Weight</div>
                                                <div>{{entry.data.userWeight.toFixed(2)}} kg</div>
                                            </div>
                                            <div class="grid-item hang-weight">
                                                <div class="item-title">Test Weight</div>
                                                <div>{{entry.data.hangWeight.toFixed(2)}} kg</div>
                                            </div>
                                            <div class="grid-item hang-rel">
                                                <div class="item-title">Rel. Weight</div>
                                                <div>{{(entry.data.hangWeight / entry.data.userWeight * 100).toFixed(2)}}%</div>
                                            </div>
                                            <div class="grid-item holds">
                                                <div class="item-title">Holds</div>
                                                <div class="custom">L {{entry.data.leftName}}</div>
                                                <div class="custom">R {{entry.data.leftName}}</div>
                                            </div>                                    
                                            <div class="grid-item board">
                                                <div class="item-title">Board</div>
                                                <div>{{entry.data.boardName}}</div>
                                            </div>
                                        </div>
                                        <!--div class="graph">
                                            <div ref="graph"></div>
                                        </div-->
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { LocalTrainingSaveData, HighscoreEntry } from '@/components/typeexports'
import { RemoteAPI, EasyRemoteApiHelpers } from '../../core/util';
import moment from 'moment';
import { HANGTIMER_FINISHED } from '../../messages';
import { StopWatch } from '../../core/stopwatch';
import { VueNavigation } from '@/core/util/vuenavigation';

interface DisplayHighscoreEntry {
    data: HighscoreEntry;
    showDetails: boolean;
}

//TODO: make scrolling virtual https://github.com/Akryum/vue-virtual-scroller

@Component
export default class Highscore extends VueNavigation {
    highscoreEntries: Array<DisplayHighscoreEntry> = [];
    backend: RemoteAPI;
    constructor() {
        super();
        this.backend = this.$root.$data.backend;
        this.$root.$on(HANGTIMER_FINISHED, (run: LocalTrainingSaveData) => {
            this.buildRows();
        });
    }
    mounted() {
        this.buildRows();
    }
    beforeDestroy() {}

    toggleRow(entry: DisplayHighscoreEntry) {
        entry.showDetails = !entry.showDetails;
    }

    async buildRows() {
        if(!this.backend.isAuthenticated()) {
            console.log("no backend yet");
            return;
        }
        this.highscoreEntries = []
        let highscores = await EasyRemoteApiHelpers.getReferenceHighscore(this.backend, "time");
        highscores = highscores.reverse();
        const hse = []
        for(const hs of highscores) {
            const hsEntry: HighscoreEntry = {
                id: hs.id,
                rank: hs.rank,
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
            hse.push({
                data: hsEntry,
                showDetails: false
            });
        }
        this.highscoreEntries = hse;
    }

    getDate(entry: HighscoreEntry) {
        return moment(entry.insertDate).format("DD.MM.YYYY")
    }

    reloadHighscore() {
        this.buildRows();
    }
}
</script>

<style scoped lang="scss">
.headline {
    background-color: #FDD835;
    width: 100%;
    font-size: 1.5em;
    font-weight: 600;
    text-align: center;
    height: 50px;
    line-height: 50px;
    box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.5);
    z-index: 1;
} 
.scroller {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: calc(100% - 50px);
}
.table-container {
    .progress-table {
        table-layout: fixed;
        border-collapse: collapse;
        width: 100%;
        .header-row {
            /*th {
                position: sticky;
                top: 0;
                background-color: white;
                box-shadow: inset 0px 1px #000, 0px 1px #000;
            }*/
            height: 40px;
            .header-cell {
                white-space: nowrap;
                border-bottom: 1px solid lightgray;
            }
            .a { width: 10%; }
            .b { }
            .c { width: 15%; }
            .d { width: 35%; }
            .e { width: 20%  }
            //.f {  }
        }
        .entry-row {
            height: 40px;
            .entry-cell {
                border-bottom: 1px solid lightgray;
                border-top: 1px solid lightgray;
                text-align: center;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
    }
    .detail-row { .detail-cell { color: black; }}
    .detail-view {
        box-sizing: border-box;
        border: 1px solid lightgray;
        border-radius: 5px;
        margin: 5px;
        .padding-container {
            .grid-container {
                display: grid;
                grid-column-gap: 10px;
                grid-row-gap: 20px;
                grid-template-columns: auto auto auto auto;
                margin: 20px;
                .grid-item {
                    .grid-item-content {
                        display: inline-block;
                    }
                    .item-title {
                        font-weight: bold;
                        white-space: nowrap;
                    }
                }
                .info {}
                .place {}
                .name {
                    .name-box {
                        max-width: 7em;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        .name { 
                            display: inline; 
                        }
                        .alias { 
                            display: inline;
                        }
                    }
                }
                .type {}
                .validity {
                    white-space: nowrap;
                    .times {
                        .time {
                            display: inline-block;
                        }
                        .hide {
                            display: none;
                        }
                    }
                }
                .time {}
                .user-weight {}
                .hang-weight {}
                .hang-rel {}
                .holds {
                    white-space: nowrap;
                }                
                .board {
                    grid-column: 2 / 4; /* span from grid column line 1 to 3 (i.e., span 2 columns) */
                    //grid-row: 1 / 3;                    
                    white-space: nowrap;
                }
            }
            .graph {
                padding: 50px;
            }
        }
    }
}

@media (max-width:600px) { 
    .table-container {
        font-size: 0.75em;
    }
}
</style>
