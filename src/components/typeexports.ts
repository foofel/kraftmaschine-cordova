import { TempSensorInterface } from '@/core/sensorreader';

export class Rectangle {
    constructor(readonly x:string, readonly y:string, readonly width:string, readonly height:string) {}
}

export type Hold = { id:number, complementary:number, name:string, type:string, shortName:string, defaultHand:string, depth:number, fingers:number, pos:{ x:number, y:number }, size: {x:number, y:number} };
export type TareWeights = { left: number, right:number };
export type SelectedHolds = { left: Hold|null, right: Hold|null, board:Hangboard };

export class HangTimerSetupData {
    constructor(
        public timer:TimerSelectorEntry = PredefinedTimers.default,
        public tareWeights:TareWeights,
        public selectedHolds:SelectedHolds,
        public userWeight:number,
        public trainWeight:number
    ) {};
}

export class HangTimerData extends HangTimerSetupData {
    constructor(
        public timer:TimerSelectorEntry = PredefinedTimers.default,
        public tareWeights:TareWeights,
        public selectedHolds:SelectedHolds,
        public userWeight:number,
        public trainWeight:number,
        public activationWeight:number
    ) {
        super(timer, tareWeights, selectedHolds, userWeight, trainWeight);
    };
}

export interface HangTimerGraphDataInterface {
    innerTimerColor:string;
    set:number;
    rep:number;
    repProgress:number;
    repDuration:number;
    repNormalized:number;
    setProgress:number;
    setDuration:number;
    setNormalized:number;
    overallProgress:number;
    overallDuration:number;
    overallNormalized:number;
    activeTimeProgress:number;
    activeTimeDuration:number;
    activeTimeNormalized:number;
    currentWeight:number;
    userWeight:number;
    activationWeight:number;
    trainWeight:number;
    leftWeight:number;
    rightWeight:number;
    trainData:HangTimerData;
}

export class HangTimerGraphData {
    constructor(
        public innerTimerColor:string,
        public set:number,
        public rep:number,
        public repProgress:number,
        public repDuration:number,
        public repNormalized:number,
        public setProgress:number,
        public setDuration:number,
        public setNormalized:number,
        public overallProgress:number,
        public overallDuration:number,
        public overallNormalized:number,
        public activeTimeProgress:number,
        public activeTimeDuration:number,
        public activeTimeNormalized:number,
        public currentWeight:number,
        public userWeight:number,
        public activationWeight:number,
        public trainWeight:number,
        public leftWeight:number,
        public rightWeight:number,
        readonly trainData:HangTimerData
    ) {};
};

export interface LocalTrainingSaveData {
    date:Date;
    timerParams:TimerSelectorEntry;
    timerDuration:number;
    timerElapsed:number;
    activeTime:number;
    maxActiveTime:number;
    humidity:number;
    activeTimeData: Array<number>;
    rawData: Array<Array<number>>;
    runNumber:number;
    hangboard: number;
    holdLeft: number|null;
    holdRight: number|null;
}

export interface Hangboard {
    id: number;
    holds:Array<Hold>;
    name:string;
    width:number;
    height:number;
    officialBenchmarkHolds: { 
        left:number;
        right:number;
    }
}

export const ChartColors = {
    blue: "rgb(54, 162, 235, 1)",
    green: "rgb(75, 192, 192, 1)",
    grey: "rgb(201, 203, 207, 1)",
    orange: "rgb(255, 159, 64, 1)",
    purple: "rgb(153, 102, 255, 1)",
    red: "rgb(255, 99, 132, 1)",
    yellow: "rgb(255, 205, 86, 1)"
};

export interface TimerBarChartData {
    active:Array<number>;
    inactive:Array<number>;
    passive:Array<number>;
    labels:Array<string>
    maxValue:number;
}

export interface BenchmarkGraphData {
    labels:Array<string>;
    changeToggle:boolean;
    dataSets: {
        [id:string]: {
            data:Array<number>;
            type:string;
        }
    }
    annotations: Array<{x:number, y:number}>;
}

export class Hangboards {
    static boardList = () : Map<number, Hangboard> => {
        let map = new Map<number, Hangboard>();
        map.set(Hangboards.none.id, Hangboards.none);
        map.set(Hangboards.twinPeaksReference.id, Hangboards.twinPeaksReference);
        map.set(Hangboards.beastmaker1000.id, Hangboards.beastmaker1000);
        map.set(Hangboards.beastmaker2000.id, Hangboards.beastmaker2000);
        return map;
    };
    static readonly none:Hangboard = { id: 0, name: "none", width: 0, height: 0, holds: [], officialBenchmarkHolds: { left: 0, right: 0 } };
    static readonly twinPeaksReference:Hangboard = {
        id: 1,
        name: "Twinpeaks Reference",
        width: 750,
        height: 180,
        /* eslint-disable standard/object-curly-even-spacing */
        holds: [
            { id:  1, complementary:  4, name: "Jug",        shortName: "Jug", type: "jug",    defaultHand: "l", depth: 50, fingers: 5, pos: { x:  0.0, y: 160.0  }, size: { x: 125.0, y: 20.0 } },
            { id:  2, complementary:  5, name: "40° Sloper", shortName: "S40", type: "sloper", defaultHand: "l", depth: 50, fingers: 5, pos: { x: 125.0, y: 138.0 }, size: { x: 125.0, y: 42.0 } },
            { id:  3, complementary:  6, name: "45° Sloper", shortName: "S45", type: "sloper", defaultHand: "l", depth: 50, fingers: 5, pos: { x: 250.0, y: 130.0 }, size: { x: 125.0, y: 50.0 } },
            { id:  4, complementary:  1, name: "Jug",        shortName: "Jug", type: "jug",    defaultHand: "r", depth: 50, fingers: 5, pos: { x: 375.0, y: 160.0 }, size: { x: 125.0, y: 20.0 } },
            { id:  5, complementary:  2, name: "40° Sloper", shortName: "S40", type: "sloper", defaultHand: "r", depth: 50, fingers: 5, pos: { x: 500.0, y: 138.0 }, size: { x: 125.0, y: 42.0 } },
            { id:  6, complementary:  3, name: "45° Sloper", shortName: "S45", type: "sloper", defaultHand: "r", depth: 50, fingers: 5, pos: { x: 625.0, y: 130.0 }, size: { x: 125.0, y: 50.0 } },

            { id:  7, complementary:  8, name: "Pocket",     shortName: "Pkt", type: "pocket", defaultHand: "l", depth: 20, fingers: 3, pos: { x:  27.5, y: 130.0 }, size: { x:  70.0, y: 25.0 } },
            { id:  8, complementary:  7, name: "Pocket",     shortName: "Pkt", type: "pocket", defaultHand: "r", depth: 20, fingers: 3, pos: { x: 402.5, y: 130.0 }, size: { x:  70.0, y: 25.0 } },

            { id:  9, complementary: 12, name: "Edge 20",    shortName: "E20", type: "edge",   defaultHand: "l", depth: 20, fingers: 4, pos: { x:  12.5, y: 90.0  }, size: { x: 100.0, y: 25.0 } },
            { id: 10, complementary: 13, name: "Edge 25",    shortName: "E25", type: "edge",   defaultHand: "l", depth: 25, fingers: 4, pos: { x: 137.5, y: 90.0  }, size: { x: 100.0, y: 25.0 } },
            { id: 11, complementary: 14, name: "Edge 30",    shortName: "E30", type: "edge",   defaultHand: "l", depth: 30, fingers: 4, pos: { x: 262.5, y: 90.0  }, size: { x: 100.0, y: 25.0 } },
            { id: 12, complementary:  9, name: "Edge 20",    shortName: "E20", type: "edge",   defaultHand: "r", depth: 20, fingers: 4, pos: { x: 387.5, y: 90.0  }, size: { x: 100.0, y: 25.0 } },
            { id: 13, complementary: 10, name: "Edge 25",    shortName: "E25", type: "edge",   defaultHand: "r", depth: 25, fingers: 4, pos: { x: 512.5, y: 90.0  }, size: { x: 100.0, y: 25.0 } },
            { id: 14, complementary: 11, name: "Edge 30",    shortName: "E30", type: "edge",   defaultHand: "r", depth: 30, fingers: 4, pos: { x: 637.5, y: 90.0  }, size: { x: 100.0, y: 25.0 } },

            { id: 15, complementary: 18, name: "Edge 10",    shortName: "E10", type: "edge",   defaultHand: "l", depth: 10, fingers: 4, pos: { x:  12.5, y: 50.0  }, size: { x: 100.0, y: 25.0 } },
            { id: 16, complementary: 19, name: "Edge 12",    shortName: "E12", type: "edge",   defaultHand: "l", depth: 12, fingers: 4, pos: { x: 137.5, y: 50.0  }, size: { x: 100.0, y: 25.0 } },
            { id: 17, complementary: 20, name: "Edge 15",    shortName: "E15", type: "edge",   defaultHand: "l", depth: 15, fingers: 4, pos: { x: 262.5, y: 50.0  }, size: { x: 100.0, y: 25.0 } },
            { id: 18, complementary: 15, name: "Edge 10",    shortName: "E10", type: "edge",   defaultHand: "r", depth: 10, fingers: 4, pos: { x: 387.5, y: 50.0  }, size: { x: 100.0, y: 25.0 } },
            { id: 19, complementary: 16, name: "Edge 12",    shortName: "E12", type: "edge",   defaultHand: "r", depth: 12, fingers: 4, pos: { x: 512.5, y: 50.0  }, size: { x: 100.0, y: 25.0 } },
            { id: 20, complementary: 17, name: "Edge 15",    shortName: "E15", type: "edge",   defaultHand: "r", depth: 15, fingers: 4, pos: { x: 637.5, y: 50.0  }, size: { x: 100.0, y: 25.0 } },

            { id: 21, complementary: 24, name: "Crimp 4",    shortName: "C4",  type: "crimp",  defaultHand: "l", depth:  4, fingers: 4, pos: { x:  12.5, y: 10.0  }, size: { x: 100.0, y: 25.0 } },
            { id: 22, complementary: 25, name: "Crimp 6",    shortName: "C6",  type: "crimp",  defaultHand: "l", depth:  6, fingers: 4, pos: { x: 137.5, y: 10.0  }, size: { x: 100.0, y: 25.0 } },
            { id: 23, complementary: 26, name: "Crimp 8",    shortName: "C8",  type: "crimp",  defaultHand: "l", depth:  8, fingers: 4, pos: { x: 262.5, y: 10.0  }, size: { x: 100.0, y: 25.0 } },
            { id: 24, complementary: 21, name: "Crimp 4",    shortName: "C4",  type: "crimp",  defaultHand: "r", depth:  4, fingers: 4, pos: { x: 387.5, y: 10.0  }, size: { x: 100.0, y: 25.0 } },
            { id: 25, complementary: 22, name: "Crimp 6",    shortName: "C6",  type: "crimp",  defaultHand: "r", depth:  6, fingers: 4, pos: { x: 512.5, y: 10.0  }, size: { x: 100.0, y: 25.0 } },
            { id: 26, complementary: 23, name: "Crimp 8",    shortName: "C8",  type: "crimp",  defaultHand: "r", depth:  8, fingers: 4, pos: { x: 637.5, y: 10.0  }, size: { x: 100.0, y: 25.0 } }
        ],
        officialBenchmarkHolds: {
            left: 9,
            right: 12
        }
        /* eslint-enable standard/object-curly-even-spacing */
    };
    static readonly beastmaker1000:Hangboard = {
        id: 2,
        name: "Beastmaker 1000",
        width: 580,
        height: 150,
        holds: [
            { id:  1, complementary: 5, name: "Jug",         shortName: "Jug", type: "jug",     defaultHand: "l", depth: 55, fingers: 5, pos: { x: 25.0, y: 130.0  }, size: { x: 90.0, y: 20.0 } },
            { id:  2, complementary: 4, name: "35° Sloper ", shortName: "S35", type: "sloper",  defaultHand: "l", depth: 55, fingers: 5, pos: { x: 115.0, y: 110.0 }, size: { x: 100.0, y: 40.0 } },
            { id:  3, complementary: 3, name: "20° Sloper",  shortName: "S20", type: "sloper",  defaultHand: "b", depth: 55, fingers: 5, pos: { x: 215.0, y: 125.0 }, size: { x: 150.0, y: 25.0 } },
            { id:  4, complementary: 2, name: "35° Sloper",  shortName: "S35", type: "sloper",  defaultHand: "r", depth: 55, fingers: 5, pos: { x: 365.0, y: 110.0 }, size: { x: 100.0, y: 40.0 } },
            { id:  5, complementary: 1, name: "Jug",         shortName: "Jug", type: "jug",     defaultHand: "r", depth: 55, fingers: 5, pos: { x: 465, y: 130.0 }, size: { x: 90.0, y: 20.0 } },

            { id:  6, complementary: 9, name: "Edge 15",     shortName: "E15", type: "edge",    defaultHand: "l", depth: 15, fingers: 4, pos: { x: 25.0, y: 95.0 }, size: { x: 80.0, y: 22.0 } },
            { id:  7, complementary: 8, name: "Pocket 30",   shortName: "P30", type: "pocket",  defaultHand: "l", depth: 30, fingers: 3, pos: { x: 220.0, y: 95.0 }, size: { x: 60.0, y: 22.0 } },
            { id:  8, complementary: 7, name: "Pocket 30",   shortName: "P30", type: "pocket",  defaultHand: "r", depth: 30, fingers: 3, pos: { x: 300.0, y: 95.0 }, size: { x: 60.0, y: 22.0 } },
            { id:  9, complementary: 6, name: "Edge 15",     shortName: "E15", type: "edge",    defaultHand: "r", depth: 15, fingers: 4, pos: { x: 475.0, y: 95.0 }, size: { x: 80.0, y: 22.0 } },

            { id: 10, complementary: 16, name: "Pocket 45",  shortName: "P45", type: "pocket",  defaultHand: "l", depth: 45, fingers: 4, pos: { x: 15.0, y: 58.0  }, size: { x: 85.0, y: 22.0 } },
            { id: 11, complementary: 15, name: "Pocket 50",  shortName: "P50", type: "pocket",  defaultHand: "l", depth: 50, fingers: 2, pos: { x: 115.0, y: 58.0  }, size: { x: 40.0, y: 22.0 } },
            { id: 12, complementary: 14, name: "Pocket 45",  shortName: "P45", type: "pocket",  defaultHand: "r", depth: 45, fingers: 3, pos: { x: 170.0, y: 58.0  }, size: { x: 60.0, y: 22.0 } },
            { id: 13, complementary: 13, name: "Pocket 53",  shortName: "P53", type: "pocket",  defaultHand: "b", depth: 53, fingers: 4, pos: { x: 245.0, y: 58.0  }, size: { x: 90.0, y: 22.0 } },
            { id: 14, complementary: 12, name: "Pocket 45",  shortName: "P45", type: "pocket",  defaultHand: "r", depth: 45, fingers: 3, pos: { x: 350.0, y: 58.0  }, size: { x: 60.0, y: 22.0 } },
            { id: 15, complementary: 11, name: "Pocket 50",  shortName: "P50", type: "pocket",  defaultHand: "r", depth: 50, fingers: 2, pos: { x: 425.0, y: 58.0  }, size: { x: 40.0, y: 22.0 } },
            { id: 16, complementary: 10, name: "Pocket 45",  shortName: "P45", type: "pocket",  defaultHand: "r", depth: 45, fingers: 4, pos: { x: 480.0, y: 58.0  }, size: { x: 85.0, y: 22.0 } },

            { id: 17, complementary: 22, name: "Edge 20",    shortName: "E20", type: "edge",    defaultHand: "l", depth: 20, fingers: 4, pos: { x:  60.0, y: 15.0  }, size: { x: 90.0, y: 22.0 } },
            { id: 18, complementary: 21, name: "Pocket 25",  shortName: "P25", type: "pocket",  defaultHand: "l", depth: 25, fingers: 2, pos: { x: 165.0, y: 15.0  }, size: { x: 40.0, y: 22.0 } },
            { id: 19, complementary: 20, name: "Pocket 20",  shortName: "P20", type: "pocket",  defaultHand: "l", depth: 20, fingers: 3, pos: { x: 222.5, y: 15.0  }, size: { x: 60.0, y: 22.0 } },
            { id: 20, complementary: 19, name: "Pocket 20",  shortName: "P20", type: "pocket",  defaultHand: "r", depth: 20, fingers: 3, pos: { x: 297.5, y: 15.0  }, size: { x: 60.0, y: 22.0 } },
            { id: 21, complementary: 18, name: "Pocket 25",  shortName: "P25",  type: "pocket", defaultHand: "r", depth: 25, fingers: 2, pos: { x: 375.0, y: 15.0  }, size: { x: 40.0, y: 22.0 } },
            { id: 22, complementary: 17, name: "Edge 20",    shortName: "E20",  type: "edge",   defaultHand: "r", depth: 20, fingers: 4, pos: { x: 430.0, y: 15.0  }, size: { x: 90.0, y: 22.0 } }
        ],
        officialBenchmarkHolds: { left: 17, right: 22 }
    };
    static readonly beastmaker2000:Hangboard = {
        id: 3,
        name: "Beastmaker 2000",
        width: 0,
        height: 1800,
        holds: [],
        officialBenchmarkHolds: { left: 0, right: 0 }
    };    
}

export interface LocalBenchmarkSaveData {
    boardId: number;
    leftId: number|null,
    rightId: number|null,
    userWeight: number,
    hangWeight: number,
    activeTime: number,
    data: {
        date: Date;
        time: Array<number>,
        weight: Array<number>,
        temperatureInfo: TempSensorInterface
    }
}

export interface BenchmarkSetupData {
    tareWeights: TareWeights;
    selectedHolds: SelectedHolds;
    userWeight: number;
}

export interface HighscoreEntry {
    // highscore
    id:number;
    rank:number;
    percentile:number;
    userWeight:number;
    hangWeight:number;
    activeTime:number;
    insertDate:Date;
    //user
    userId:number;
    userAlias:string;
    userName:string;
    // board
    boardId:number;
    boardName:string;
    // holds stuff
    leftId:number;
    leftDepth:number;
    leftName:string;
    rightId:number;
    rightDepth:number;
    rightName:string;
}

export class TimerEntry {
    constructor(
        public readonly warmup:number,      // get ready countdown
        public readonly active:number,      // time to execute the activity
        public readonly passive:number,     // rest time between active times
        public readonly repeats:number,     // how often to repeat active + passive
        public readonly pause:number,       // pause between sets
        public readonly sets:number,        // how many sets "(active + passive) * repeats" until the whole workout is done
        public readonly cooldown:number     // to relax after the workout
    ) {}
};

export interface TimerSelectorEntry {
    id: string;
    name:string;
    desc:string;
    data:TimerEntry;
};

export const PredefinedTimers = {
    timers: [
        {
            id: "r6O9TznYgp",
            name: "7/5 basic",
            desc: "7s hang with 5s rest for one minute. then 3m pause.",
            data: new TimerEntry(10, 7, 5, 5, 180, 6, 0)
        }, {
            id: "NCPhaAalem",
            name: "7/3 basic",
            desc: "7s hang with 3s rest for one minute. then 3m pause.",
            data: new TimerEntry(10, 7, 3, 6, 180, 6, 0)
        }, {
            id: "9TRDPVqu1a",
            name: "10s max hangs",
            desc: "10s hang with max weight on both hands, then 3m pause",
            data: new TimerEntry(10, 10, 0, 1, 180, 10, 10)
        }, {
            id: "3oaOgQSlG0",
            name: "10s max hangs (alt)",
            desc: "10s hang with max weight on one hand, 5s break to switch hands then 3m pause",
            data: new TimerEntry(10, 10, 5, 2, 180, 10, 10)
        }, {
            id: "qAbvsL4lvJ",
            name: "Test/Debug 39",
            desc: "10s hang with max weight on one hand, 5s break to switch hands then 3m break",
            data: new TimerEntry(1, 3, 5, 3, 5, 3, 5)
        }
    ],
    get default() { return this.timers[0]; },
    get test() { return this.timers[this.timers.length - 1]; }
};

export type NavigationLeaveResponse = "ok" | "ask" | "block";
export interface NavigationComponent {
    canLeaveComponent: () => NavigationLeaveResponse;
    onBeforeShowDialog: () => void;
}

export interface DrawContextInfo {
    base: HTMLElement|null;
    canvas: HTMLCanvasElement|null;
    ctx: CanvasRenderingContext2D|null;
    width: number;
    height: number;
}

export interface DataModelComponentValueInterface {
    value:string|number|boolean;
    type:string;
    edit:string;
    displayName:string;
    desc: string;
}
export interface DataModelComponentModelInterface {
    [id:string]: DataModelComponentValueInterface;
}
export interface DataModelComponentDataInterface {
    title:string;
    model: DataModelComponentModelInterface;
}

export interface StaticData {
    boards:Array<Hangboard>|null;
}

export interface BenchmarkVisualHighscoreEntry {
    id:number;
    time:number;
    rank:number;
    percentile:number;
    name:string;
    //priority:number;
}

export interface BenchmarkVisualModelMarker {
    time: number;
    text:string;
    bgColor: string;
    borderColor: string;
    priority: number;
    drawName:boolean;
    draw:boolean;
}

export interface BenchmarkVisualClockMarker extends BenchmarkVisualHighscoreEntry {
}

export interface BenchmarkVisualModel {
    highscore:Array<BenchmarkVisualHighscoreEntry>
    timeMarkers:Array<BenchmarkVisualModelMarker>
    percentileMarkers:Array<BenchmarkVisualModelMarker>
    clockMarkers:Array<BenchmarkVisualClockMarker>
}