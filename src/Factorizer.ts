import { Observable, Observer } from "./Observable";
import { Decimal } from "decimal.js";
import Scheduler from "./Scheduler.js";
import WeAssert from "we-assert";
import isPrime from "./PrimeChecker.js";
import { v4 as uuidv4 } from "uuid";
import { check, since, weKnowThat, letUs, weHave, soWe } from "@xerocross/literate";
import Subscriber from "./Subscriber";

type CancelFunction = (command : string) => void;
type WaitFunction = (func : ((...args : any) => void)) => (() => void);

const { D } 
= letUs("define Decimal alias", () => {
    const D = (x : string | number) => {
        return new Decimal(x);
    };
    return  { D };
});

function Factorizer (queryObject : any) {
    Decimal.set({ precision : 64 });
    const id = uuidv4().substring(0, 8);
    let worker : Worker;
    let factorIndex : number;
    const scheduledSubscribers : Subscriber[] = [] ;
    let waitFunction : WaitFunction;
    const cancelFunctions : CancelFunction[] = [];
    let lastFactor : Decimal | undefined;
    const we = WeAssert.build();
    let globalHalt = false;
    we.setLevel("ERROR");
    we.setHandler((message) => {
        throw new Error(`${id}: The following assertion failed: ${message}`);
    });

    // will be exported
    function clear () : void {
        globalHalt = true;
        console.debug(`${id}: clearing`);
        for (const subscriber of scheduledSubscribers) {
            subscriber.cancel();
        }
        for (const cancel of cancelFunctions) {
            cancel("halt");
        }
        lastFactor = undefined;
    }

    // getNextFactor breaks up the work of finding
    // the next factor into asynchronous smaller calculations
    // on subintervals that are relative in size to the
    // size of the input quotient.
    // The point of this is to allow for greater responsivenss
    // in the browser even for computations with large numbers.
    function getNextFactor (integer : Decimal, quotient : Decimal, observer) : Promise<Decimal> {
        console.debug(`${id}: finding next factor of ${quotient}`);
        we.assert.atLevel("ERROR").that("quotient is an integer", quotient.floor().equals(quotient));
        let isFactorResolved = false;
        return new Promise((nextFactorResolve, nextFactorReject) => {
            const key = `${integer.toString()}${factorIndex}`;
            let lastCheckedNumber;
            // keep track of the reject functions
            // so we can halt promises abruptly
            // if user input changes--to avoid 
            // unnecessary computation
            cancelFunctions.push(nextFactorReject);
            
            const computeGlobalValues = () => {
                const { globalMax }
                = weKnowThat(`if quotient is a perfect square like 25, then we must
                include its square root as a factor, so the values i that
                we check must go up to at least the square root`, () => {
                    return soWe(`define the globalMax to be one greater`, () => {
                        const globalMax = quotient.squareRoot().ceil().plus(1);
                        return { globalMax };
                    });
                });
                
                // plus 1 accounts for numbers that are perfect squares
                // set an intervalLength that is meaningful
                // to the size of the input
                const globalDiv1000 = globalMax.div(new Decimal(100)).floor();
                // the following ternary logic is to handle the case
                // where quotient is a relatively small number
                const intervalLength = globalDiv1000.equals(D(0)) ? D(1000) : globalDiv1000;
                const globalStartValue = new Decimal(2);
                we.assert.atLevel("ERROR").that("globalStartValue >= 2", globalStartValue.greaterThanOrEqualTo(D(2)));
                weKnowThat(`if intervalLength=1000 and globalMax=3 then globalMax.div(intervalLength)=
                [a small decimal between 0 and 1]. In that case .ceil() makes numIntervals 1.`);
                const numIntervals = globalMax.div(intervalLength).ceil();
                we.assert.atLevel("ERROR").that("if intervalLength=1000 and globalMax < 10 then numIntervals=1",
                    (intervalLength.equals(D(1000)) && globalMax.lessThan(D(10))) ? numIntervals.equals(D(1)) : true
                );
                return { globalMax, intervalLength, globalStartValue, numIntervals };
            };

            const intervalMaxUpperBound = (intervalIndex : Decimal, intervalLength : Decimal, globalMax : Decimal) => {
                return Decimal.min(intervalIndex.plus(1).times(intervalLength), globalMax);
            };

            const intervalStartValue = (intervalIndex : Decimal, intervalLength : Decimal) : Decimal => {
                return Decimal.max(intervalIndex.times(intervalLength), D(2));
            };

            function executeInterval (intervalIndex : Decimal) : Promise<Decimal> {

                const { globalMax, intervalLength, globalStartValue, numIntervals } = 
                computeGlobalValues();
                const intervalMax = intervalMaxUpperBound(intervalIndex, intervalLength, globalMax);
                console.log(`WHAT MATTERS`);
                let i = intervalStartValue(intervalIndex, intervalLength);
                console.debug(`starting interval ${intervalIndex}; globalStartValue: ${i}; globalMax : ${globalMax}`);
                
                if (weHave("i > global max", i.greaterThan(globalMax))) {
                    weKnowThat("the recursion should end", () => {
                        console.log(`terminating interval: ${intervalIndex}; will return ${quotient}`);
                        we.assert.atLevel("DEBUG").that("quotient is prime", () => isPrime(quotient));
                        since("that quotient is prime", () => {
                            letUs("return quotient itself as the only factor of quotient", () => {
                                return Promise.resolve(quotient);
                            });
                        });
                    });
                }
                return new Promise((intervalResolve, intervalReject) => {
                    cancelFunctions.push(intervalReject);
                    // indicate to subscriber that a meaningful
                    // tick of work is starting
                    observer.next({
                        status : "working"
                    });
                    console.log(`in executeInterval: i: ${i}; intervalIndex: ${intervalIndex}; numIntervals: ${numIntervals}`);

                    if (check("there are more subintervals", intervalIndex.lessThan(numIntervals))) {
                        console.debug(`${id} checking: globalStartValue: ${globalStartValue}; intervalMax: ${intervalMax}; intervalLength: ${intervalLength}; integer: ${integer}`);
                        // check all numbers in the interval
                        // until either we find a factor
                        // or we reach the global max
                        const subscriber : Subscriber = {
                            cancel : () => {},
                            observable : null
                        };
                        const scheduledObject = new Scheduler().schedule(() => {
                            // begin main asynchronous computation function
                            if (check("i >= global max", i.greaterThanOrEqualTo(globalMax))) {
                                weKnowThat("quotient is prime");
                                letUs("return that the first factor of quotient is quotient", () => {
                                    intervalResolve(quotient);
                                });
                                return;
                            }
                            // find smallest i that divides quotient
                            for(; i.lessThan(intervalMax); i = i.plus(D(1))) {
                                we.assert.atLevel("ERROR").that(`i:${i} > 1`, i.greaterThan(new Decimal(1)));
                                // the following is a sanity check
                                // to avoid silent errors
                                // we want to make sure we didn't skip any
                                // numbers between 2 and globalMax
                                we.assert.atLevel("ERROR").that("i = globalStartValue or i = lastCheckedNumber + 1", i.equals(globalStartValue) || i.equals(lastCheckedNumber.plus(D(1))));
                                we.assert.atLevel("ERROR").that("lastCheckedNumber does not divide quotient", lastCheckedNumber ? !quotient.modulo(lastCheckedNumber).equals(D(0)): true);

                                const iDividesQuotient = quotient.modulo(i).equals(0);
                                if (weHave("i is a factor of quotient", iDividesQuotient)) {
                                    // since we checked each number from 2 to globalMax
                                    // in order, if we reach this line it proves
                                    // that i is the smallest number between 2 and globalMax
                                    // that divides quotient

                                    // resolve the deferred at the
                                    // getNextFactor level
                                    // bfoundFactorDeferred.resolve(i);
                                    console.log(`${id}: found that ${i} divides ${quotient}; resolving`);
                                    //nextFactorResolve(i);
                                    since("i divides the quotient", () => {
                                        letUs("resolve the subinterval", () => {
                                            intervalResolve(i);
                                            weKnowThat("the entire nextFactor function will be resolved");
                                        });
                                    });
                                    letUs("set a flag to indicate we have found the next factor", () => {
                                        isFactorResolved = true;
                                    });
                                    return;
                                }
                                since("we don't want to accidentally skip any numbers", () => {
                                    letUs("keep track of the last number we checked", () => {
                                        lastCheckedNumber = i;
                                    });
                                });
                            }
                            // end main asynchronous computation function
                        }, subscriber);
                        scheduledSubscribers.push(subscriber);
                        scheduledObject
                            .then(() => {
                                const nextIndex = intervalIndex.plus(new Decimal(1));
                                console.log(`${id} finished testing interval index: ${intervalIndex};`);
                                // computation for the next interval
                                // is called asynchronously whenever
                                // computation for the previous interval
                                // has completed.
        
                                // unless the overall goal of finding
                                // the next factor has been resolved.
                                if (check("next factor has not been found yet", !isFactorResolved)) {
                                    since("the next factor has been found", () => {
                                        letUs("recurse down into the next interval", () => {
                                            console.log(`recursing down into index: ${nextIndex}`);
                                            intervalResolve(executeInterval(nextIndex));
                                        });
                                    });
                                } else {
                                    since(`we found the next factor without having to check all the subintervals`, () => {
                                        weKnowThat(`we do not have to recurse down into the next subinterval`);
                                    });
                                    console.debug(`${id} factor found before checking all intervals: not recursing down to index ${nextIndex}`);
                                }
                            })
                            .catch((e) => {
                                since("we encountered an error in the asynchronous computation", () => {
                                    letUs("reject this interval to throw the error", () => {
                                        intervalReject(e);
                                    });
                                });
                            });
                    } else { 
                        weKnowThat("there are no more subintervals");
                        // there are no more intervals
                        // all intervals have been processed until
                        // the index i has reached at least globalMax

                        // here the condition i.greaterThanOrEqualTo(intervalDetails.globalMax)
                        // should always be true. We put a check on this
                        // as a sanity check to avoid potential silent
                        // errors.
                        if(!we.assert.atLevel("ERROR").that("i > globalMax", i.greaterThan(globalMax))) {
                            console.error(`i: ${i}; globalMax: ${globalMax}; intervalIndex: ${intervalIndex}`);
                        }
                        
                        weKnowThat(`no number from 2 up to sqrt(quotient)+1 
                        divides the quotient, so the quotient is prime. Thus
                        the 'next factor' of quotient is quotient`);
                        // the following line is a long computation that should
                        // only be turned on for extensive debugging purposes
                        we.assert.atLevel("DEBUG").that("quotient is prime", isPrime(quotient));
                        console.debug(`${id}: resolved next factor: ${quotient}`);
                        intervalResolve(quotient);
                        isFactorResolved = true;
                    }
                });
            }
            console.warn("query", queryObject);
            if (queryObject["worker"] == "false" || worker == undefined || worker == null) {
                console.log("not using worker");
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
                
                const intervalIndex = new Decimal(0);
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
                    if (e.data.status == "received halt request") {
                        console.debug(`worker received halt request on integer ${e.data.payload.integer.toString()}`);
                    }
                    if (e.data.status == "halted") {
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
    
    async function factorRecursion (integer : Decimal, quotient : Decimal, observer : Observer) {
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
            "status" : "factor",
            "payload" : {
                "factor" : nextFactor
            }
        });
        const newQuotient = quotient.div(nextFactor);
        if (!globalHalt) {
            if (typeof waitFunction === "function") {
                return await waitFunction(() => factorRecursion (integer, newQuotient, observer));
            } else {
                return await factorRecursion (integer, newQuotient, observer);
            }
        } else {
            console.debug(`${id} halted`);
            return;
        }
    }

    this.factor = function (integer : Decimal, workerIn : Worker, waitFunctionIn : WaitFunction, subscriber : Subscriber) {
        globalHalt = false;
        console.log(`${id}: begin factoring integer : ${integer}.`);
        we.assert.atLevel("ERROR").that(`input ${integer.toString()} is an integer`, integer.floor().equals(integer));
        let observable;
        const factorPromise = new Promise((factorResolve, factorReject) => {
            cancelFunctions.push(factorReject);
            waitFunction = waitFunctionIn;
            worker = workerIn;
            factorIndex = 0;
            
            // when someone executes subscribe on the
            // observable, that fires the factorRecursion
            // to find the next factor

            observable = new Observable((observer : Observer) => {
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
}
export default Factorizer;