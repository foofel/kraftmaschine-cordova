export class StopWatch {
    startTime:number | null = null;
    stopTime:number | null = null;
    started:boolean = false;
    constructor(shouldStart:boolean = true) {
        if(shouldStart) {
            this.start();
        }
    }
    isStarted():boolean {
        return this.started;
    };
    start(initial:number = 0):void {
        if(this.started) {
            return;
        }
        this.started = true;
        if(this.stopTime) {
            let lastDuration = this.stopTime - (this.startTime || 0);
            this.startTime = performance.now() - lastDuration - initial;
            this.stopTime = null;
        } else {
            this.startTime = performance.now() + initial;
        }
    };
    stop():void {
        if(!this.started) {
            return;
        }        
        this.started = false;
        this.stopTime = performance.now();
    };
    reset():void {
        this.started = false;
        this.startTime = null;
        this.stopTime = null;
    };
    restart(initial:number = 0):void {
        this.started = true;
        this.startTime = performance.now() - initial;
        this.stopTime = null;
    };
    elapsed():number {
        if(!this.startTime) {
            return 0;
        }
        if(!this.stopTime) {
            return (performance.now() - this.startTime) / 1000;
        }
        return (this.stopTime - this.startTime) / 1000;
    };
}