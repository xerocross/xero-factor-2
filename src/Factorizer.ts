import Observable from "./Observable";
import { Subscriber, Observer } from "./Observable.d";
import { Decimal } from "decimal.js";
import { Watcher } from "./Scheduler.d";
import WeAssert from "we-assert";
import { v4 as uuidv4 } from "uuid";
import FactorRequestHandler from "./NextFactorRequestHandler";
import { check, since, weKnowThat, letUs, weHave, soWe, so, weHaveThat } from "@xerocross/literate";
import type { WaitFunction } from "./WaitFunction.d.ts";
import type { QueryObject } from "./QueryObject";
type CancelFunction = (command : string) => void;



class FactoringWorkObject {
    
    constructor(id : string, primaryInteger: Decimal) {
        this.id = id;
        this.primaryInteger = primaryInteger;
    }
    public id : string;
    public primaryInteger : Decimal;
    public factors : Decimal[];
    public currentQuotient : Decimal;

    setCurrentQuotient (currentQuotient : Decimal) {
        this.currentQuotient = currentQuotient;
    }
    getFactors () {
        return this.factors;
    }
}


const { D } 
= letUs("define Decimal alias", () => {
    const D = (x : string | number) => {
        return new Decimal(x);
    };
    return  { D };
});
Decimal.set({ precision : 64 });

class Factorizer {

    constructor(queryObject : any, worker : Worker) {
        this.queryObject = queryObject;
        this.worker = worker;
        this.id = uuidv4().substring(0, 8);
        this.factorRequestHandler = new FactorRequestHandler();
        this.we = WeAssert.build();
        this.we.setLevel("ERROR");
        this.we.setHandler((message : string) => {
            throw new Error(`${this.id}: The following assertion failed: ${message}`);
        });
    }
    // newly organized
    private we;
    private id : string;
    private queryObject : QueryObject;
    private worker : Worker;
    private factorRequestHandler : typeof FactorRequestHandler;
    // prior
    
    private factorIndex : number;
    const scheduleWatchers : Watcher[] = [] ;
    private waitFunction : WaitFunction;
    //const cancelFunctions : CancelFunction[] = [];
    //private lastFactor : Decimal | undefined;
    //private globalHalt = false;
    //private ongoingFactoring = {};

    

    // will be exported
    // clear is deprecated
    // private clear = () : void => {
    //     globalHalt = true;
    //     console.debug(`${id}: clearing`);
    //     for (const watcher of scheduleWatchers) {
    //         watcher.cancel();
    //     }
    //     for (const cancel of cancelFunctions) {
    //         cancel("halt");
    //     }
    //     lastFactor = undefined;
    // }

    // getNextFactor breaks up the work of finding
    // the next factor into asynchronous smaller calculations
    // on subintervals that are relative in size to the
    // size of the input quotient.
    // The point of this is to allow for greater responsivenss
    // in the browser even for computations with large numbers.
    private getNextFactor = (factoringWorkObject: FactoringWorkObject) : Promise<Decimal> => {
        let quotient = factoringWorkObject.currentQuotient;
        let integer = factoringWorkObject.primaryInteger;
        let factorIndex = factoringWorkObject.getFactors().length;
        
        console.debug(`${this.id}: finding next factor of ${quotient}`);
        this.we.assert.atLevel("ERROR").that("quotient is an integer", quotient.isInteger());
        return new Promise((nextFactorResolve) => {
            const key = `${integer.toString()}${factorIndex}`;
            if (this.queryObject["worker"] == "false" || this.worker == undefined || this.worker == null) {
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
                this.factorRequestHandler.post({
                    "status" : "factor",
                    "payload" : {
                        "quotient" : quotient.toString(),
                        "integer" : integer.toString(),
                        "lastFactor" : lastFactor ? lastFactor.toString() : ""
                    },
                    "key" : key
                })
                    .then((response) => {
                        if (response.status == "factor" && response.key == key) {
                            console.debug(`${id} worker sent message: next factor : ${response.payload.factor}; key : ${response.key}`);
                            nextFactorResolve(new Decimal(response.payload.factor));
                        }
                        if (response.status == "received halt request") {
                            console.debug(`worker received halt request on integer ${response.payload.integer.toString()}`);
                        }
                        if (response.status == "halted") {
                            console.debug(`worker halted on ${response.payload.integer.toString()}`);
                        }
                        if (response.status === "error") {
                            console.debug(`worker encountered an error`, response.payload.error);
                        }
                    })
                    .catch((e) => {
                        console.error("an unexpected error occured", e);
                    });
            } else {
                console.debug(`${id} using worker`);
                this.worker.onmessage = function (e) {
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
                this.worker.postMessage({
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
        const one = D(1);
        if (weHaveThat("the quotient is 1", quotient.equals(one))) {
            return weKnowThat("we have reached the base case", () => {
                return so("let's end the factor recursion", () => {
                    console.debug(`${id} reached base case 1: resolving factor recursion;`);
                    return;
                });
            });
        }

        const nextFactor = await getNextFactor(integer, quotient, observer);
        letUs(`keep track of the last factor because when computing the next
        factor after this, we can start at lastFactor instead of 2`, () => {
            lastFactor = nextFactor;
        });
        
        
        console.log(`${id} getNextFactor returned: ${nextFactor}`);
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
        const factorId = uuidv4();
        weKnowThat("we are resetting to factor a new inupt value", () => {
            soWe("reset globalHalt", () => {
                globalHalt = false;
                weKnowThat(`in the below asynchronous code, 
                if globalHalt is true, then the it will
                stop execution of the factoring`);
            });
            console.log(`${id}: begin factoring integer : ${integer}.`);
        });
        
        we.assert.atLevel("ERROR").that(`input ${integer.toString()} is an integer`, integer.isInteger());

        const setObservableOnSubscriber = (observable : Observable) => {
            subscriber.observable = observable;
        };

        const factorPromise = new Promise((factorResolve, factorReject) => {
            cancelFunctions.push(factorReject);
            waitFunction = waitFunctionIn;
            factorIndex =
                letUs("keep track of which factor we are computing", () => {
                    return 0;
                });
            
            // when someone executes subscribe on the
            // observable, that fires the factorRecursion
            // to find the next factor

            const observable = new Observable((observer : Observer) => {
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
            letUs("put the observable Promise<Observable> on the subscriber object", () => {
                setObservableOnSubscriber(observable);
            });
            
        });
        ongoingFactoring[factorId] = { "integer" : integer };
        Object.assign(subscriber, { clear, factorId });
        return factorPromise;
    };
    this.factor.getId = () => {
        return id;
    };
    
    this.halt = () => {
        this.FactorRequestHandler.post({
            "status" : "halt",
            "payload" : {
                "integer" : this.lastInteger.toString()
            }
        });
    };
}
export default Factorizer;