import { Observable } from "./Observable.js";
import { Decimal } from "decimal.js";
import offset from "./Offset.js";

const factorize = function () {
    Decimal.set({ precision : 64 });
    let worker;
    let factorIndex;
    let offsetSubscribers = [];
    let waitFunction;
    let cancelFunctions = [];

    // will be exported
    function clear () {
        for (let subscriber of offsetSubscribers) {
            subscriber.cancel();
        }
        for (let fun of cancelFunctions) {
            fun("halt");
        }
    }

    // getNextFactor breaks up the work of finding
    // the next factor into asynchronous smaller calculations
    // on subintervals that are relative in size to the
    // size of the input quotient.
    // The point of this is to allow for greater responsivenss
    // in the browser even for computations with large numbers.
    function getNextFactor (integer, quotient, observer) {
        let isFactorResolved = false;
        return new Promise((nextFactorResolve, nextFactorReject) => {
            let key = "" + quotient.toString() + factorIndex;
            cancelFunctions.push(nextFactorReject);
            let lastCheckedNumber;
            let numbersCheckedInSequence = (i) => {
                if (lastCheckedNumber) {
                    if (!i.equals(lastCheckedNumber.plus(new Decimal(1)))) {
                        throw new Error(`exception: didn't check between ${lastCheckedNumber} and ${i}`);
                    }
                }
                lastCheckedNumber = i;
            };
            // keep track of the reject functions
            // so we can halt promises abruptly
            // if user input changes--to avoid 
            // unnecessary computation
            cancelFunctions.push(nextFactorReject);
            
            let computeIntervalDetails = (index, quotient) => {
                let max = quotient.squareRoot().ceil().plus(1);
                // plus 1 accounts for numbers that are perfect squares
                let intervalLength = max.div(new Decimal(100)).floor();
                // the following ternary logic is to handle the case
                // where quotient is a relatively small number
                intervalLength = intervalLength.equals(new Decimal(0)) ? new Decimal(1000) : intervalLength;
                let firstEltOfInterval = index.times(intervalLength);
                // exclude 1 explicitly because the smallest
                // prime is 2
                let start = Decimal.max(firstEltOfInterval, new Decimal(2)); 
                let localMax = Decimal.min(index.plus(1).times(intervalLength), max);
                
                // set an intervalLength that is meaningful
                // to the size of the input
                
                let numIntervals = max.div(intervalLength).ceil();
                return {
                    start, localMax, firstEltOfInterval, max, intervalLength, numIntervals
                };
            };
            function executeInterval (index) {
                // indicate to subscriber that a meaningful
                // tick of work is starting
                let intervalDetails = computeIntervalDetails(index, quotient);
                let i = intervalDetails.start;
                const intervalDone = new Promise((intervalResolve, intervalReject) => {
                    cancelFunctions.push(intervalReject);
                    observer.next({
                        status : "working"
                    });
                    
                    console.debug(`start: ${intervalDetails.start}; localMax: ${intervalDetails.localMax}; intervalLength: ${intervalDetails.intervalLength}; integer: ${integer}`);
                    if (index.lessThan(intervalDetails.numIntervals)) {
                        // check all numbers in the interval
                        // until either we find a factor
                        // or we reach the global max
                        const subscriber = {};
                        const offsetObject = offset(() => {
                            // begin main asynchronous computation function
                            if (i.greaterThanOrEqualTo(intervalDetails.max)) {
                                // this indicates that quotient itself is
                                // the only remaining factor
                                nextFactorResolve(quotient);
                                return;
                            }
                            // find smallest i that divides quotient
                            while (i.lessThan(intervalDetails.localMax)) {
                                // sanity check
                                if (i.equals(new Decimal(1))) {
                                    throw new Error("i was 1");
                                }
                                // the following is a sanity check
                                // to avoid silent errors
                                numbersCheckedInSequence(i);

                                let divides = quotient.modulo(i).equals(0);
                                if (divides) {
                                    // resolve the deferred at the
                                    // getNextFactor level
                                    // bfoundFactorDeferred.resolve(i);
                                    nextFactorResolve(i);
                                    isFactorResolved = true;
                                    // exit the executeInterval function
                                    return;
                                }
                                i = i.add(1);
                            }
                            // end main asynchronous computation function
                        }, subscriber);
                        // store offsetObject
                        offsetSubscribers.push(subscriber);
                        offsetObject
                            .then(() => {
                                intervalResolve(true);
                            })
                            .catch((e) => {
                                intervalReject(e);
                            });

                    } else { 
                        // there are no more intervals
                        // all intervals have been processed until
                        // the index i has reached at least max

                        // here the condition i.greaterThanOrEqualTo(intervalDetails.max)
                        // should always be true. We put a check on this
                        // as a sanity check to avoid potential silent
                        // errors.
                        if (i.greaterThanOrEqualTo(intervalDetails.max)) {
                            nextFactorResolve(quotient);
                            isFactorResolved = true;
                        } else {
                            nextFactorReject(new Error("An logical error has occurred"));
                            throw new Error("logical error");
                        }
                    }
                });

                if (i.greaterThanOrEqualTo(intervalDetails.max)) {
                    nextFactorResolve(quotient);
                } else {
                    // recurse down using next index
                    const nextIndex = index.plus(new Decimal(1));
                    intervalDone
                        .then(() => {
                            // computation for the next interval
                            // is called asynchronously whenever
                            // computation for the previous interval
                            // has completed.

                            // unless the overall goal of finding
                            // the next factor has been resolved.
                            if (!isFactorResolved) {
                                return executeInterval(nextIndex);
                            } else {
                                console.debug("search successful before checking all intervals");
                            }
                        })
                        .catch((e) => {
                            console.debug("An unexpected event has occurred: halting");
                            nextFactorReject(e);
                        });
                }
                return intervalDone;
            }
            // by the time this function is called, the work
            // will have been broken up inter intervals, and
            // this chunk of synchronous code will only handle
            // the index'th interval 
            if (true || worker == undefined || worker == null) {
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
                executeInterval(intervalIndex);
            } else {
                console.debug("using worker");
                worker.onmessage = function (e) {
                    if (e.data.key == key) {
                        console.debug(`worker sent message: integer : ${e.data.result}; key : ${e.data.key}`);
                        nextFactorResolve(new Decimal(e.data.result));
                    }
                };
                worker.postMessage({
                    "integer" : quotient.toString(),
                    "key" : key
                });
            }
            factorIndex++;
        });
    }

    function factorRecursion (integer, quotient, observer) {
        let factorPromise;
        factorPromise = new Promise((factorRecursionResolve, factorRecursionReject) => {
            const one = new Decimal(1);
            // base case stops the recursion
            cancelFunctions.push(factorRecursionReject);
            if (quotient.equals(one)) {
                factorRecursionResolve();
            } else {
                getNextFactor(integer, quotient, observer)
                    .then((newFactor) => {
                        // by the logic of the computation
                        // 'factor' should be an integer divisor
                        // of quotient
                        let newQuotient = quotient.div(newFactor);
                        observer.next({
                            status : "factor",
                            payload : {
                                factor : newFactor
                            }
                        });
                        // I want the window painted before
                        // we move on to the next computation
                        try {
                            waitFunction(() => {
                                factorRecursion(integer, newQuotient, observer)
                                    .then(() => {
                                        factorRecursionResolve();
                                    })
                                    .catch((e) => {
                                        console.debug("encountered an unexpected error: halting");
                                        factorRecursionReject(e);
                                    });
                            });
                        } catch (e) {
                            console.debug("was not able to use $nextTick and requestAnimationFrame");
                            factorRecursion(integer, newQuotient, observer);
                        }
                    })
                    .catch((e) => {
                        if (e === "halt") {
                            factorRecursionReject("halt");
                        } else {
                            observer.next({
                                status : "error",
                                payload : {
                                    error : e
                                }
                            });
                            console.debug("encountered an unexpected error");
                            console.log(e);
                            factorRecursionReject(e);
                        }
                    });
            }

        });
        return factorPromise;
    }

    // integer is a Decimal
    const factor = function (integer, workerIn, waitFunctionIn, subscriber) {
        let factorPromise;
        let observable;
        factorPromise = new Promise((factorResolve, factorReject) => {
            cancelFunctions.push(factorReject);
            waitFunction = waitFunctionIn;
            worker = workerIn;
            factorIndex = 0;
            
            observable = new Observable((observer) => {
                factorRecursion(integer, integer, observer)
                    .then(() => {
                        factorResolve("success");
                    })
                    .catch((e) => {
                        if (e === "halt") {
                            factorReject("halt");
                        } else {
                            observer.next({
                                status : "error",
                                payload : {
                                    error : e
                                }
                            });
                            console.debug("an unexpected error has occured: halting");
                            factorReject(e);
                        }
                    });
            });
        });
        subscriber.observable = observable;
        Object.assign(subscriber, { observable, clear});
        return factorPromise;
    };
    return factor;
};
export default factorize();