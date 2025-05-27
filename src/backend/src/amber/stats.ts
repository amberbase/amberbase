import { AmberMetricName, AmberMetricsBucket } from './../../../client/src/shared/dtos.js';

import { Express, Request, Response } from 'express';
import { Config } from "./config.js";
import { allTenantsId, AmberAuth } from "./auth.js";

export interface AmberStats{
    getTenantMinuteMetrics(tenant:string): AmberMetricsBucket[];
    getTenantHourMetrics(tenant:string): AmberMetricsBucket[];
    getGlobalMinuteMetrics(): AmberMetricsBucket[];
    getGlobalHourMetrics(): AmberMetricsBucket[];
    trackMetric(name:AmberMetricName, value:number, tenant?:string | undefined): void;
    addStatsProvider(provider:StatsProvider): void;
}

export type Stats = {[name in AmberMetricName]?:{[tenant:string]:number}} ;

export interface StatsProvider{
    stats(): Promise<Stats>;
}

class AmberStatsService implements AmberStats{

    globalMinuteBuckets: AmberMetricsBucket[] = [];
    globalHourBuckets: AmberMetricsBucket[] = [];
    perTenantMinuteBuckets: Map<string, AmberMetricsBucket[]> = new Map();
    perTenantHourBuckets: Map<string, AmberMetricsBucket[]> = new Map();

    maxBuckets: number = 60;
    
    statsProviders: StatsProvider[] = [];

    constructor(){
        setInterval(() => {
            this.statsProviders.forEach(async (provider) => {
                var stats = await provider.stats();
                for (let [metric, tenants] of Object.entries(stats)) {
                    var metricName = metric as AmberMetricName;
                    for (var [tenant, value] of Object.entries(tenants)) {
                        this.trackMetric(metricName, value, tenant, true);
                    }
                }
            });
        }, 10 * 1000); // todo: should be 60s
    }

    addStatsProvider(provider:StatsProvider): void{
        this.statsProviders.push(provider);
    }

    getTenantMinuteMetrics(tenant:string): AmberMetricsBucket[]{
       return getBuckets(this.getTenantBuckets(tenant).minute, this.maxBuckets, 1, minuteBucketName);
    }

    getTenantHourMetrics(tenant:string): AmberMetricsBucket[]{
        return getBuckets(this.getTenantBuckets(tenant).hour, this.maxBuckets, 60, hourBucketName);
    }

    getGlobalMinuteMetrics(): AmberMetricsBucket[]{
        return getBuckets(this.globalMinuteBuckets, this.maxBuckets, 1, minuteBucketName);
    }

    getGlobalHourMetrics(): AmberMetricsBucket[]{
        return getBuckets(this.globalHourBuckets, this.maxBuckets, 60, hourBucketName);
    }

    trackMetric(name:AmberMetricName, value:number, tenant?:string | undefined, overwrite?:boolean | undefined): void{
        
        var minuteName = minuteBucketName(new Date());
        var hourName = hourBucketName(new Date());
        if (tenant)
        {
            var buckets = this.getTenantBuckets(tenant);
            trackInBucket(buckets.minute, this.maxBuckets, minuteName, name, value, overwrite);
            trackInBucket(buckets.hour, this.maxBuckets, hourName, name, value, overwrite);
        }
        trackInBucket(this.globalMinuteBuckets, this.maxBuckets, minuteName, name, value, overwrite);
        trackInBucket(this.globalHourBuckets, this.maxBuckets, hourName, name, value, overwrite);
    }

    getTenantBuckets(tenant:string):{hour: AmberMetricsBucket[], minute: AmberMetricsBucket[]}{
        var minuteBuckets = this.perTenantMinuteBuckets.get(tenant);
        if (!minuteBuckets) {
            minuteBuckets = [];
            this.perTenantMinuteBuckets.set(tenant, minuteBuckets);
        }

        var hourBuckets = this.perTenantHourBuckets.get(tenant);
        if (!hourBuckets) {
            hourBuckets = [];
            this.perTenantHourBuckets.set(tenant, hourBuckets);
        }
        return {hour: hourBuckets, minute: minuteBuckets};
    }
}

export var amberStats : AmberStats = new AmberStatsService();


/**
 * Render buckets for consumption by a client. That means we are enumerating even those that do not have any content (and therefore are not stored in the buffer)
 * @param buckets Buckets to render
 * @param maxBuckets Number of buckets in the past to render
 * @param stepMinutes minutes between buckets. Used to render hours and minutes
 * @param bucketNameFactory name per bucket. Used to render hours and minutes
 * @returns Completed list of the last maxBuckets buckets, even if they are empty
 */
function getBuckets(buckets: AmberMetricsBucket[], maxBuckets: number, stepMinutes: number, bucketNameFactory: (d:Date)=>string): AmberMetricsBucket[] {
    var cursorTime = new Date();
    cursorTime.setTime(cursorTime.getTime() - 60 * 1000 * maxBuckets * stepMinutes);
    var result: AmberMetricsBucket[] = [];
    var bucketMap = new Map<string, AmberMetricsBucket>();
    for (var i = 0; i < buckets.length; i++) {
        var bucket = buckets[i];
        bucketMap.set(bucket.bucket, bucket);
    }

    for (var i = 0; i < maxBuckets + 1; i++) {
        var bucketName = bucketNameFactory(cursorTime);
        var existingBucket = bucketMap.get(bucketName);
        result.push(existingBucket || { bucket: bucketName, metrics: {} });
        cursorTime.setTime(cursorTime.getTime() + 60 * 1000 * stepMinutes);
    }

    return result;
}

function getRoundedDateAsString(minutes:number, d: Date) : Date {

    let ms = 1000 * 60 * minutes; 
    let roundedDate = new Date(Math.round(d.getTime() / ms) * ms);
    
    return roundedDate;
  }

function minuteBucketName(date:Date): string{
    return getRoundedDateAsString(1, date).toISOString().substring(0, 16);
}

function hourBucketName(date:Date): string{
    return getRoundedDateAsString(1, date).toISOString().substring(0, 13);
}

function trackInBucket(buckets:AmberMetricsBucket[], maxBuckets:number, bucketName:string, metricName:AmberMetricName, value:number, overwrite:boolean): void{
    var bucket = buckets.at(-1);
    if (!bucket || bucket.bucket != bucketName) {
        bucket = {bucket:bucketName, metrics:{}};
        buckets.push(bucket);
        while(buckets.length > maxBuckets){
            buckets.shift();
        }
    }

    var metrics = bucket.metrics;
    if (!metrics[metricName] || overwrite) {
        metrics[metricName] = {min:value, max:value, sum:value, count:1};
    } else {
        var metric = metrics[metricName];
        metric.min = Math.min(metric.min, value);
        metric.max = Math.max(metric.max, value);
        metric.sum += value;
        metric.count++;
    }
}


export function enableStatsApis(app:Express, config:Config, authService: AmberAuth)  {

    app.get( '/tenant/:tenant/metrics/minute', (req: Request, res: Response) => {
        if (!authService.checkAdmin(req, res)) return;
        var tenant = req.params.tenant;
        if (tenant == allTenantsId) {
            res.json(amberStats.getGlobalMinuteMetrics());    
        }
        else
        {
            res.json(amberStats.getTenantMinuteMetrics(tenant));
        }
    });
    
    app.get( '/tenant/:tenant/metrics/hour', (req: Request, res: Response) => {
        if (!authService.checkAdmin(req, res)) return;
        var tenant = req.params.tenant;
        if (tenant == allTenantsId) {
            res.json(amberStats.getGlobalHourMetrics());    
        }
        else
        {
        res.json(amberStats.getTenantHourMetrics(tenant));
        }
    });

    app.get( '/metrics/minute', (req: Request, res: Response) => {
        if (!authService.checkAdmin(req, res)) return;
        res.json(amberStats.getGlobalMinuteMetrics());
    });
    app.get( '/metrics/hour', (req: Request, res: Response) => {
        if (!authService.checkAdmin(req, res)) return;
        res.json(amberStats.getGlobalHourMetrics());
    });
    
}