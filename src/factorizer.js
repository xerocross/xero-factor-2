import { Observable } from "./Observable.js";
import { Decimal } from "decimal.js";
import q from "q";
import offset from "./Offset.js"

const factorize = function () {
    Decimal.set({ precision : 64 });
    let worker;
    let timeoutQueue;
    let factorIndex;
    let deferreds;
    let deferredKeys;
    let offsetObjects = [];
    let vueComponent;

    // will be exported
    function clear () {
        for (let timeout of timeoutQueue) {
            clearTimeout(timeout);
        }
        for (let key of deferredKeys) {
            if (deferreds[key]) {
                deferreds[key].reject("halt");
                delete deferreds[key];
            }
        }
        for (let offsetObj of offsetObjects) {
            offsetObj.cancel();
        }
    }

    // getNextFactor breaks up the work of finding
    // the next factor into asynchronous smaller calculations
    // on subintervals that are relative in size to the
    // size of the input quotient.
    // The point of this is to allow for greater responsivenss
    // in the browser even for computations with large numbers.
    function getNextFactor (integer, quotient, observer) {
        let foundFactorDeferred = q.defer();
        let key = "" + quotient.toString() + factorIndex;
        deferreds[key] = foundFactorDeferred;
        let lastCheckedNumber;
        // keep track of these deferreds so they can be
        // canceled (rejected) if the work changes 
        // abruptly
        deferredKeys.push(key);

        let intervalLength;
        let max;
        let numIntervals;
        let intervalIndex;
        // by the time this function is called, the work
        // will have been broken up inter intervals, and
        // this chunk of synchronous code will only handle
        // the indexth interval 
        function executeInterval (index) {
            // indicate to subscriber that a meaningful
            // tick of work is starting, completed
            observer.next({
                status : "working"
            });
            let firstEltOfInterval = index.times(intervalLength);
            // exclude 1 explicitly because the smallest
            // prime is 2
            let start = Decimal.max(firstEltOfInterval, new Decimal(2)); // firstEltOfInterval.equals(new Decimal(1)) ? new Decimal(2) : firstEltOfInterval;
            let localMax = Decimal.min(index.plus(1).times(intervalLength), max);
            let intervalDeferred = q.defer();
            let i = start;
            console.debug(`start: ${start}; localMax: ${localMax}; intervalLength: ${intervalLength}; integer: ${integer}`);
            if (index.lessThan(numIntervals)) {
                // check all numbers in the interval
                // until either we find a factor
                // or we reach the global max
                const offsetObject = offset(() => {
                    if (i.greaterThanOrEqualTo(max)) {
                        // this indicates that quotient itself is
                        // the only remaining factor
                        foundFactorDeferred.resolve(quotient);
                        return;
                    }
                    // find smallest i that divides quotient
                    while (i.lessThan(localMax)) {
                        if (i.equals(new Decimal(1))) {
                            throw new Error("i was 1");
                        }
                        // the following is a sanity check
                        // to avoid silent errors
                        if (lastCheckedNumber) {
                            if (!i.equals(lastCheckedNumber.plus(new Decimal(1)))) {
                                throw new Error(`exception: didn't check between ${lastCheckedNumber} and ${i}`)
                            }
                        }
                        lastCheckedNumber = i;
                        let divides = quotient.modulo(i).equals(0);
                        if (divides) {
                            // resolve the deferred at the
                            // getNextFactor level
                            foundFactorDeferred.resolve(i);
                            // exit the executeInterval function
                            return;
                        }
                        i = i.add(1);
                    }
                    
                });
                offsetObjects.push(offsetObject);
                offsetObject.promise
                    .then(() => {
                        intervalDeferred.resolve(true);
                    });

                const nextIndex = index.plus(new Decimal(1));
                intervalDeferred.promise
                    .then(() => {
                        // computation for the next interval
                        // is called asynchronously whenever
                        // computation for the previous interval
                        // has completed.

                        // unless the overall goal of finding
                        // the next factor has been resolved.
                        if (!foundFactorDeferred.promise.isFulfilled()) {
                            executeInterval(nextIndex);
                        } else {
                            console.debug("terminated search for factor before checking all intervals");
                        }
                    });
            } else {
                // all intervals have been processed until
                // the index i has reached at least max

                // here the condition i.greaterThanOrEqualTo(max)
                // should always be true. We put a check on this
                // as a sanity check to avoid potential silent
                // errors.
                if (i.greaterThanOrEqualTo(max)) {
                    foundFactorDeferred.resolve(quotient);
                } else {
                    foundFactorDeferred.fail(new Error("An unexpected error has occurred"));
                }
            }
        }
        
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
            max = quotient.squareRoot().ceil();
            // set an intervalLength that is meaningful
            // to the size of the input
            intervalLength = max.div(new Decimal(100)).floor();
            // the following ternary logic is to handle the case
            // where quotient is a relatively small number
            intervalLength = intervalLength.equals(new Decimal(0)) ? new Decimal(1000) : intervalLength;
            numIntervals = max.div(intervalLength).ceil();
            intervalIndex = new Decimal(0);
            executeInterval(intervalIndex);
        } else {
            console.debug("using worker");
            worker.onmessage = function (e) {
                if (e.data.key == key) {
                    console.debug(`worker sent message: integer : ${e.data.result}; key : ${e.data.key}`);
                    foundFactorDeferred.resolve(new Decimal(e.data.result));
                }
            };
            worker.postMessage({
                "integer" : quotient.toString(),
                "key" : key
            });
        }
        factorIndex++;
        return foundFactorDeferred.promise;
    }





    function factorRecursion (integer, factors, quotient, observer, deferred) {
        const one = new Decimal(1);
        // base case stops the recursion
        if (quotient.equals(one)) {
            deferred.resolve(one);
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
                        vueComponent.$nextTick(() => {
                            window.requestAnimationFrame(() => {
                                factorRecursion(integer, factors, newQuotient, observer, deferred);
                            });
                        });
                    } catch (e) {
                        console.debug("was not able to use $nextTick and requestAnimationFrame");
                        factorRecursion(integer, factors, newQuotient, observer, deferred);
                    }

                })
                .fail((e) => {
                    if (e === "halt") {
                        deferred.reject(`halt`);
                    } else {
                        observer.next({
                            status : "error",
                            payload : {
                                error : e
                            }
                        });
                        deferred.reject(e);
                    }
                });
        }
        return deferred.promise;
    }

    // integer is a Decimal
    const factor = function (integer, workerIn, vueComponentIn) {
        worker = workerIn;
        vueComponent = vueComponentIn;
        factorIndex = 0;
        const factors = [];
        timeoutQueue = [];
        deferreds = {};
        deferredKeys = [];
        const defer = q.defer();
        const observable = new Observable((observer) => {
            factorRecursion(integer, factors, integer, observer, defer)
                .then(() => {
                    observer.next({
                        status : "success"
                    });
                })
                .fail((e) => {
                    if (e === "halt") {
                        console.debug("halted");
                    } else {
                        observer.next({
                            status : "error",
                            payload : {
                                error : e
                            }
                        });
                    }
                });
        });
        return { observable : observable, clear : clear }
    }
    return factor;
}
export default factorize();