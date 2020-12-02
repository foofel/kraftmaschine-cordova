interface Timeout {
    lastUpdate: number;
    intervall: number;
    next: () => number;
}
interface TimeoutDict {
    [key: string]: Timeout;
}

export class UpdateScheduler {
    now: number;
    timeoutLookup: TimeoutDict = {}
    //allowedTimeouts:number = 1;
    //timeoutsExecuted:number = 0;
    constructor() {
        this.now = 0;
    }
    registerTimeout(key: string, intervall: number) {
        this.timeoutLookup[key] = { 
            lastUpdate: 0, 
            intervall: intervall, 
            next: function() { 
                return this.intervall + this.lastUpdate;
            }
        };
    }
    /*restartFrame() {
        this.timeoutsExecuted = 0;
    }*/
    checkTimeout(key: string) {
        /*if(this.timeoutsExecuted >= this.allowedTimeouts) {
            return false;
        }*/
        const updateObject = this.timeoutLookup[key];
        const now = performance.now();
        if(now >= updateObject.next()) {
            updateObject.lastUpdate = now;
            //this.timeoutsExecuted++;
            return true;
        }
        return false;
    }
}