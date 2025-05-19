import { sleep } from "../../../client/src/shared/helper.js";
import * as crypto from 'node:crypto';
export class BruteProtection{
    heat: number = 0;
    last:number = Date.now();
    parallel = 0;
    maxParallel = 10;
    resetDurationMs = 60_000;
    maxHeat = 12;
    heatIncreaseBelowDuration = 1000;

    constructor(maxHeat?: number, resetDurationMs?: number, heatIncreaseBelowDuration?: number, maxParallel?: number){
        this.maxHeat = maxHeat || this.maxHeat;
        this.resetDurationMs = resetDurationMs || this.resetDurationMs;
        this.heatIncreaseBelowDuration = heatIncreaseBelowDuration || this.heatIncreaseBelowDuration;
        this.maxParallel = maxParallel || this.maxParallel;
    }

    async check():Promise<boolean>{
        if (this.parallel > this.maxParallel){
            return false;
        }
        
        this.parallel++;
        var msSinceLastLogin = Date.now() - this.last;
        if (msSinceLastLogin > this.resetDurationMs){
            this.heat = 0;
        } else
        if (msSinceLastLogin < this.heatIncreaseBelowDuration && this.heat < this.maxHeat){
            this.heat++;
        }
        else
        {
            if (this.heat > 0)
            {
                this.heat--;
            }
        }
        this.last = Date.now();

        await sleep(crypto.randomInt(1, 10) + (2^this.heat)*10); // add a little delay to make timing and brute force attacks harder
        this.parallel--;
        return true;
    }

}