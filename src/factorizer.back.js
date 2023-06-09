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

    function getNextFactor (integer, quotient) {
        let deferred = q.defer();
        let key = "" + quotient.toString() + factorIndex;
        deferreds[key] = deferred;
        deferredKeys.push(key);
        if (true) {
        //     let max = quotient.squareRoot().ceil();
        //     let intervalLength = new Decimal(100_000);
        //     let numIntervals = max.div(new Decimal(intervalLength)).ceil();
        //     let intervalIndex = new Decimal(0);

        //     function executeInterval(index) {
        //         console.log(`execute interval: ${index}`);
        //         let start = index.times(intervalLength);
        //         console.log(`start index: ${start}`);
        //         let localMax = Decimal.min(index.plus(1).times(intervalLength), max);
        //         let intervalDeferred = q.defer();
        //         let i = index.equals(new Decimal(0)) ? new Decimal(2) : start;
        //         if (index.lessThan(numIntervals)) {
        //             console.log(`continuing: i: ${i.toString()}; index: ${index}; max: ${max}; numIntervals: ${numIntervals}; localMax: ${localMax}`);
        //             timeoutQueue.push(
        //                 setTimeout(() => {
        //                     if (i.greaterThanOrEqualTo(max)) {
        //                         deferred.resolve(quotient);
        //                         return;
        //                     }
        //                     while (i.lessThan(localMax)) {
        //                         console.log(`testing: ${i.toString()}: localMax: ${localMax}`);
        //                         let test = quotient.modulo(i).equals(0);
        //                         if (test) {
        //                             deferred.resolve(i);
        //                             return;
        //                         }
        //                         i = i.add(1);
        //                     }
        //                     intervalDeferred.resolve(true);
        //                 })
        //             );
        //             index = index.plus(new Decimal(1));
        //             intervalDeferred.promise.then(() => {
        //                 executeInterval(index);
        //             });
        //         } else {
        //             if (i.greaterThanOrEqualTo(max)) {
        //                 console.log(`resolving: i: ${i.toString()}; index: ${index}; max: ${max};`)
        //                 deferred.resolve(quotient);
        //             } else {
        //                 console.log(`else: i: ${i.toString()}; index: ${index}; max: ${max};`)
        //             }
        //         }
                
        //     }
        //     executeInterval(intervalIndex);






            timeoutQueue.push(
                setTimeout(() => {
                    
                    let max = quotient.squareRoot().ceil();
                    let inverval = max.div(new Decimal(10)).ceil();
                    let i = new Decimal(2);
                    
                    while (i.lessThan(max)) {
                        let test = quotient.modulo(i).equals(0);
                        if (test) {
                            deferred.resolve(i);
                            break;
                        }
                        i = i.add(1);
                    }

                    deferred.resolve(quotient);
                }, 0)
            );
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
        console.log(`factor recursion: integer : ${integer}, quotient: ${quotient}`);
        const one = new Decimal(1);
        if (quotient.equals(one)) {
            deferred.resolve(one);
        } else {
            getNextFactor(integer, quotient)
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
                            console.log("tick");
                            factorRecursion(integer, factors, newQuotient, observer, deferred);
                        });
                    });
                    
                })
                .fail((e) => {
                    if (e === "halt") {
                        console.log("halt");
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
                        console.log("halt");
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