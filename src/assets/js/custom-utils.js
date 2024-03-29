export function SmartInterval(asyncFn, cycledDelay, startDelay) {

    this.asyncFn = asyncFn;
    this.cycleDelay = cycledDelay;
    this.startDelay = startDelay;

    this.runningState = { isRunning: false };
    this.timers = [];
}

SmartInterval.prototype.start = function () {

    if (this.runningState.isRunning) {
        console.log("SmartInterval is already running, please stop it first.");
        return;
    }

    let runningState = this.runningState;
    let loop = async () => {
        await this.asyncFn();
        if (runningState.isRunning) {
            this.timers.push(setTimeout(loop.bind(this), this.cycleDelay));
        }
    };

    this.timers.push(setTimeout(loop.bind(this), this.startDelay));
    this.runningState.isRunning = true;
    console.log('SmartInterval started.');
};

SmartInterval.prototype.stop = function () {

    if (!this.runningState.isRunning) {
        console.log('SmartInterval is already stopped, please start it first.');
        return;
    }

    this.runningState.isRunning = false;
    this.timers.forEach(timer => clearTimeout(timer));
    console.log('SmartInterval stopped.');
    this.runningState = { isRunning: false };
};
