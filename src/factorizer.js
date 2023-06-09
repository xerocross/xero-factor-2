import { Observable } from "./Observable.js";
import { Decimal } from "decimal.js";
import q from "q";

const factorize = function () {
    Decimal.set({ precision : 64 });
    let worker;
    let timeoutQueue;
    let factorIndex;
    let deferreds;
    let deferredKeys;
    let vueComponent;

    function clear () {
        for (let timeout of timeoutQueue) {
            clearTimeout(timeout);
        }
        for (let key of deferredKeys) {
            deferreds[key].reject("halt");
            delete deferreds[key];
        }
    }

    function getNextFactor (integer, quotient, observer) {
        let deferred = q.defer();
        let key = "" + quotient.toString() + factorIndex;
        deferreds[key] = deferred;
        deferredKeys.push(key);
        if (worker !== undefined && worker !== undefined) {
            let max = quotient.squareRoot().ceil();
            let intervalLength = max.div(new Decimal(100)).floor(); //new Decimal(10_000);
            intervalLength = intervalLength.equals(new Decimal(0)) ? new Decimal(1) : intervalLength;
            let numIntervals = max.div(intervalLength).ceil();
            let intervalIndex = new Decimal(0);

            function executeInterval(index) {

                observer.next({
                    status: "working"
                });
                let prestart = index.times(intervalLength);
                let start = prestart.equals(new Decimal(1)) ? new Decimal(2) : prestart;
                let localMax = Decimal.min(index.plus(1).times(intervalLength), max);
                let intervalDeferred = q.defer();
                let i = index.equals(new Decimal(0)) ? new Decimal(2) : start;
                if (index.lessThan(numIntervals)) {
                    timeoutQueue.push(
                        setTimeout(() => {
                            if (i.greaterThanOrEqualTo(max)) {
                                deferred.resolve(quotient);
                                return;
                            }
                            while (i.lessThan(localMax)) {
                                let test = quotient.modulo(i).equals(0);
                                if (test) {
                                    deferred.resolve(i);
                                    return;
                                }
                                i = i.add(1);
                            }
                            intervalDeferred.resolve(true);
                        })
                    );
                    index = index.plus(new Decimal(1));
                    intervalDeferred.promise.then(() => {
                        executeInterval(index);
                    });
                } else {
                    if (i.greaterThanOrEqualTo(max)) {
                        deferred.resolve(quotient);
                    } 
                }
                
            }
            executeInterval(intervalIndex);
        } else {
            console.log("using worker");
            worker.onmessage = function (e) {
                if (e.data.key == key) {
                    console.log(`worker sent message: integer : ${e.data.result}; key : ${e.data.key}`);
                    deferred.resolve(new Decimal(e.data.result));
                }
            };
            worker.postMessage({
                "integer" : quotient.toString(),
                "key" : key
            });
        }
        factorIndex++;
        return deferred.promise;
    }
        
    function factorRecursion (integer, factors, quotient, observer, deferred) {
        const one = new Decimal(1);
        if (quotient.equals(one)) {
            deferred.resolve(one);
        } else {
            getNextFactor(integer, quotient, observer)
                .then((newFactor) => {
                    let newQuotient = quotient.div(newFactor);
                    observer.next({
                        status : "factor",
                        payload : {
                            factor : newFactor
                        }
                    });
                    vueComponent.$nextTick(() => {
                        window.requestAnimationFrame(() => {
                            factorRecursion(integer, factors, newQuotient, observer, deferred);
                        });
                    });
                    
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
        timeoutQueue = [];
        factorIndex = 0;
        factorIndex = 0;
        deferreds = {};
        deferredKeys = [];
        const factors = [];
        const observable = new Observable((observer) => {
            const defer = q.defer();
            factorRecursion(integer, factors, integer, observer, defer)
                .then(() => {
                    observer.next({
                        status : "success"
                    });
                })
                .fail((e) => {
                    if (e === "halt") {
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