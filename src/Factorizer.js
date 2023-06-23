import { Observable } from "./Observable.js";
import { Decimal } from "decimal.js";
import offset from "./Offset.js";
import WeAssert from "we-assert";
import isPrime from "./PrimeChecker.js";
import { v4 as uuidv4 } from "uuid";

function Factorizer () {
    Decimal.set({ precision : 64 });
    let id = uuidv4().substring(0,8);
    let worker;
    let factorIndex;
    let offsetSubscribers = [];
    let waitFunction;
    let cancelFunctions = [];
    let lastFactor;
    const we = WeAssert.build();
    let globalHalt = false;
    we.setLevel("ERROR");
    we.setHandler((message) => {
        throw new Error(`${id}: The following assertion failed: ${message}`);
    });

    // will be exported
    function clear () {
        globalHalt = true;
        console.debug(`${id}: clearing`);
        for (let subscriber of offsetSubscribers) {
            subscriber.cancel();
        }
        for (let fun of cancelFunctions) {
            fun("halt");
        }
        lastFactor = undefined;
    }

    // getNextFactor breaks up the work of finding
    // the next factor into asynchronous smaller calculations
    // on subintervals that are relative in size to the
    // size of the input quotient.
    // The point of this is to allow for greater responsivenss
    // in the browser even for computations with large numbers.
    function getNextFactor (integer, quotient, observer) {
        console.debug(`${id}: finding next factor of ${quotient}`);
        we.assert.atLevel("ERROR").that("quotient is an integer", quotient.floor().equals(quotient));
        let isFactorResolved = false;
        return new Promise((nextFactorResolve, nextFactorReject) => {
            let key = "" + integer.toString() + factorIndex;
            let lastCheckedNumber;
            // keep track of the reject functions
            // so we can halt promises abruptly
            // if user input changes--to avoid 
            // unnecessary computation
            cancelFunctions.push(nextFactorReject);
            
            let computeIntervalDetails = (index, quotient) => {
                let globalMax = quotient.squareRoot().ceil().plus(1);
                // plus 1 accounts for numbers that are perfect squares
                // set an intervalLength that is meaningful
                // to the size of the input
                let intervalLength = globalMax.div(new Decimal(100)).floor();
                // the following ternary logic is to handle the case
                // where quotient is a relatively small number
                intervalLength = intervalLength.equals(new Decimal(0)) ? new Decimal(1000) : intervalLength;
                let firstEltOfInterval = index.times(intervalLength);
                // exclude 1 explicitly because the smallest
                // prime is 2
                let start = Decimal.max(firstEltOfInterval, new Decimal(2));
                we.assert.atLevel("ERROR").that("start >= 2", start.greaterThanOrEqualTo(new Decimal(2)));
                let intervalMax = Decimal.min(index.plus(1).times(intervalLength), globalMax);
                let numIntervals = globalMax.div(intervalLength).ceil();
                return {
                    start, intervalMax, firstEltOfInterval, globalMax, intervalLength, numIntervals
                };
            };

            function executeInterval (index) {
                let intervalDetails = computeIntervalDetails(index, quotient);
                let i = intervalDetails.start;
                console.debug(`starting interval ${index}; start: ${i}; globalMax : ${intervalDetails.globalMax}`);
                if (i.greaterThanOrEqualTo(intervalDetails.globalMax)) {
                    // terminate
                    console.log(`terminating interval: ${index}; will return ${quotient}`);
                    we.assert.atLevel("DEBUG").that("quotient is prime", () => isPrime(quotient));
                    return Promise.resolve(quotient);
                }
                return new Promise((intervalResolve, intervalReject) => {
                    cancelFunctions.push(intervalReject);
                    // indicate to subscriber that a meaningful
                    // tick of work is starting
                    observer.next({
                        status : "working"
                    });
                    if (index.lessThan(intervalDetails.numIntervals)) {
                        console.debug(`${id} checking: start: ${intervalDetails.start}; intervalMax: ${intervalDetails.intervalMax}; intervalLength: ${intervalDetails.intervalLength}; integer: ${integer}`);
                        // check all numbers in the interval
                        // until either we find a factor
                        // or we reach the global max
                        const subscriber = {};
                        const offsetObject = offset(() => {
                            // begin main asynchronous computation function
                            if (i.greaterThanOrEqualTo(intervalDetails.globalMax)) {
                                // this indicates that quotient itself is
                                // the only remaining factor
                                intervalResolve(quotient);
                                return;
                            }
                            // find smallest i that divides quotient
                            while (i.lessThan(intervalDetails.intervalMax)) {
                                we.assert.atLevel("ERROR").that(`i:${i} > 1`, i.greaterThan(new Decimal(1)));
                                // the following is a sanity check
                                // to avoid silent errors
                                // we want to make sure we didn't skip any
                                // numbers between 2 and globalMax
                                we.assert.atLevel("ERROR").that("i = 2 or i = lastCheckedNumber + 1", i.equals(new Decimal(2)) || i.equals(lastCheckedNumber.plus(new Decimal(1))));
                                we.assert.atLevel("ERROR").that("lastCheckedNumber does not divide quotient", lastCheckedNumber ? !quotient.modulo(lastCheckedNumber).equals(0): true);

                                let divides = quotient.modulo(i).equals(0);
                                if (divides) {
                                    // since we checked each number from 2 to globalMax
                                    // in order, if we reach this line it proves
                                    // that i is the smallest number between 2 and globalMax
                                    // that divides quotient

                                    // resolve the deferred at the
                                    // getNextFactor level
                                    // bfoundFactorDeferred.resolve(i);
                                    console.log(`${id}: found that ${i} divides ${quotient}; resolving`);
                                    //nextFactorResolve(i);
                                    intervalResolve(i);
                                    isFactorResolved = true;
                                    // exit the executeInterval function
                                    return;
                                }
                                lastCheckedNumber = i;
                                i = i.add(1);
                            }
                            // end main asynchronous computation function
                        }, subscriber);
                        offsetSubscribers.push(subscriber);
                        offsetObject
                            .then(() => {
                                const nextIndex = index.plus(new Decimal(1));
                                console.log(`${id} finished testing interval index: ${index};`);
                                // computation for the next interval
                                // is called asynchronously whenever
                                // computation for the previous interval
                                // has completed.
        
                                // unless the overall goal of finding
                                // the next factor has been resolved.
                                if (!isFactorResolved) {
                                    console.log(`recursing down into index: ${nextIndex}`);
                                    intervalResolve(executeInterval(nextIndex));
                                } else {
                                    console.debug(`${id} factor found before checking all intervals: not recursing down to index ${nextIndex}`);
                                }
                            })
                            .catch((e) => {
                                intervalReject(e);
                            });
                    } else { 
                        // there are no more intervals
                        // all intervals have been processed until
                        // the index i has reached at least globalMax

                        // here the condition i.greaterThanOrEqualTo(intervalDetails.globalMax)
                        // should always be true. We put a check on this
                        // as a sanity check to avoid potential silent
                        // errors.
                        
                        if (we.assert.atLevel("ERROR").that("i >= globalMax", i.greaterThanOrEqualTo(intervalDetails.globalMax))) {
                            // If we reach this line it means that no number
                            // from 2 up to sqrt(quotient)+1 divides the quotient, so
                            // quotient is prime. In other words, the smallest next
                            // factor of quotient is quotient.
                            we.assert.atLevel("DEBUG").that("quotient is prime", isPrime(quotient));
                            console.debug(`${id}: resolved next factor: ${quotient}`);
                            //nextFactorResolve(quotient);
                            intervalResolve(quotient);
                            isFactorResolved = true;
                        }
                    }
                });
            }
                
            if (worker == undefined || worker == null) {
                // worker is not available
                
                // For work in a browser without web worker
                // support, we divide up the work of checking
                // for divisors using intervals that are
                // proportional to the square root.
                // The functions for checking each interval
                // are scheduled asynchronously in order to
                // avoid blocking the interface for an
                // intolerable length of time. Even so, since
                // the interval lengths grow with the square
                // root of the input, for large input values
                // the browser will block for longer times.
                // Obviously web workers are preferred, and
                // if they are available on the browser, then
                // we use them
                
                let intervalIndex = new Decimal(0);
                executeInterval(intervalIndex)
                    .then((newFactor) => {
                        console.debug(`${id} exucuting all intervals finished; factor: ${newFactor}.`);
                        nextFactorResolve(newFactor);
                    })
                    .catch((e) => {
                        console.error(`${id} encountered error while executing intervals`);
                        throw e;
                    });
            } else {
                console.debug(`${id} using worker`);
                worker.onmessage = function (e) {
                    if (e.data.status == "factor" && e.data.key == key) {
                        console.debug(`${id} worker sent message: next factor : ${e.data.payload.factor}; key : ${e.data.key}`);
                        nextFactorResolve(new Decimal(e.data.payload.factor));
                    }
                    if (e.data.status === "received halt request") {
                        console.debug(`worker received halt request on integer ${e.data.payload.integer.toString()}`);
                    }
                    if (e.data.status === "halted") {
                        console.debug(`worker halted on ${e.data.payload.integer.toString()}`);
                    }
                    if (e.data.status === "error") {
                        console.debug(`worker encountered an error`, e.data.payload.error);
                    }
                };
                worker.postMessage({
                    "status" : "factor",
                    "payload" : {
                        "quotient" : quotient.toString(),
                        "integer" : integer.toString(),
                        "lastFactor" : lastFactor ? lastFactor.toString() : ""
                    },
                    "key" : key
                });
            }
            factorIndex++;
        });
    }
    
    async function factorRecursion (integer, quotient, observer) {
        console.debug(`${id}  factor recursion: integer:${integer}; quotient:${quotient};`);
        const one = new Decimal(1);
        if (quotient.equals(one)) {
            console.debug(`${id} reached base case 1: resolving factor recursion;`);
            return;
        }
        const nextFactor = await getNextFactor(integer, quotient, observer);
        lastFactor = nextFactor;
        console.log(`${id}  getNextFactor returned: ${nextFactor}`);
        observer.next({
            status : "factor",
            payload : {
                factor : nextFactor
            }
        });
        let newQuotient = quotient.div(nextFactor);
        if (!globalHalt) {
            if (typeof waitFunction === Function) {
                return await waitFunction(() => factorRecursion (integer, newQuotient, observer));
            } else {
                return await factorRecursion (integer, newQuotient, observer);
            }
        } else {
            console.debug(`${id} halted`);
            return;
        }
    }

    // integer is a Decimal
    this.factor = function (integer, workerIn, waitFunctionIn, subscriber) {
        globalHalt = false;
        console.log(`${id}: begin factoring integer : ${integer}.`);
        we.assert.atLevel("ERROR").that(`input ${integer.toString()} is an integer`, integer.floor().equals(integer));
        let factorPromise;
        let observable;
        factorPromise = new Promise((factorResolve, factorReject) => {
            cancelFunctions.push(factorReject);
            waitFunction = waitFunctionIn;
            worker = workerIn;
            factorIndex = 0;
            
            // when someone executes subscribe on the
            // observable, that fires the factorRecursion
            // to find the next factor

            observable = new Observable((observer) => {
                console.log(`${id} starting factorRecursion`);
                factorRecursion(integer, integer, observer)
                    .then(() => {
                        console.debug(`${id} sending success event`);
                        observer.next({
                            status : "success"
                        });
                        factorResolve("success");
                    })
                    .catch((e) => {
                        
                        if (e === "halt") {
                            console.debug(`${id} halt`);
                            factorReject("halt");
                        } else {
                            observer.next({
                                status : "error",
                                payload : {
                                    error : e
                                }
                            });
                            console.debug("${id} an unexpected error has occured", e);
                            factorReject(e);
                        }
                    });
            });
        });
        subscriber.observable = observable;
        Object.assign(subscriber, { observable, clear });
        return factorPromise;
    };
    this.factor.getId = () => {
        return id;
    };
};
export default Factorizer;