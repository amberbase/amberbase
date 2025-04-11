export class AsyncQueue<T> {
    queue:T[] = [];
    pendingRequests: ((item:T)=>void)[] = [];
    constructor() {
        
    }
    
    async enqueue(item:T) {
        this.queue.push(item);
        if (this.pendingRequests.length > 0) {
            var pendingCall = this.pendingRequests.shift();
            if (pendingCall) {
                pendingCall(item);
            }
        }
    }

    async dequeue() : Promise<T> {
        if (this.queue.length > 0) {
            Promise.resolve(this.queue.shift());
        }
        return new Promise<T>((resolve, reject) => {
            this.pendingRequests.push(resolve);
        });
    }
}

export class CompletablePromise<T> {
    promise!: Promise<T>;
    resolver!: (value: T) => void;
    value: T | null = null;
    prepare() {
        this.promise = new Promise<T>((resolve, reject) => {
            this.resolver = resolve;
        });
    }

    constructor() {
        this.prepare();
    }

    set(value: T) {
        this.value = value;
        this.resolver(value);
        this.prepare();
    }
}

export function sleep(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}