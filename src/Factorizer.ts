import Observable from "./Observable";
import { Observer } from "./Observable.d";
import { Decimal } from "decimal.js";
import WeAssert from "we-assert";
import { v4 as uuidv4 } from "uuid";
import NextFactorRequestHandler from "./NextFactorRequestHandler";
import { weKnowThat, letUs, so, weHaveThat, noteThat, since } from "@xerocross/literate";
import type { WaitFunction } from "./WaitFunction.d.ts";
import type { QueryObject } from "./QueryObject";
import type { NextFactorInformationObject, NextFactorRequestEvent } from "./NextFactorRequestHandler.d";
import type { FactoringWorkObject, FactorRequest } from "./Factorizer.d";
import type { WebWorkerRequestData } from "./get-factor-worker.d";

const { D } 
= letUs("define Decimal alias", () => {
    const D = (x : string | number) => {
        return new Decimal(x);
    };
    return  { D };
});
Decimal.set({ precision : 64 });
const we = WeAssert.build();

interface WorkerFactorRequestHaltObject {
    halt : (() => void)
}

interface FactorEvent {
    status : string,
    payload : {
        "factor" : string
    }
}

class Factorizer {
    constructor (queryObject : QueryObject, worker : Worker | null) {
        noteThat(`A singleton Factorizer will be created for each instance of the Xero-Factor-2 app.`);
        this.queryObject = queryObject;
        this.worker = worker;
        this.id = uuidv4().substring(0, 8);
        if (queryObject.assertionLevel) {
            we.setLevel(queryObject.assertionLevel);
        } else {
            we.setLevel("ERROR");
        }
        we.setHandler((message : string) => {
            throw new Error(`${this.id}: The following assertion failed: ${message}`);
        });
    }

    private id : string;
    private queryObject : QueryObject;
    private worker : Worker | null;
    private nextFactorRequestHandlers : ({
        handler : NextFactorRequestHandler,
        id : string,
        key : string
        integer : string
        factorIndex : string
    })[] = [];

    private workerFactorRequestHaltFunctions : WorkerFactorRequestHaltObject[] = [];
    private integerIndex = 0;
    private waitFunction : WaitFunction | undefined;

    /*
    * getNextFactor breaks up the work of finding
    * the next factor into asynchronous smaller calculations
    * on subintervals that are relative in size to the
    * size of the input quotient.
    * The point of this is to allow for greater responsivenss
    * in the browser even for computations with large numbers.
    */

    public setWaitFunction (waitFunction : WaitFunction) {
        this.waitFunction = waitFunction;
    }

    private getNextFactor = (factoringWorkObject : FactoringWorkObject) : Promise<Decimal> => {
        const quotient = factoringWorkObject.quotient;
        const integer = factoringWorkObject.primaryInteger;
        const lastFactor = factoringWorkObject.lastFactor;
        const factorIndex = factoringWorkObject.factorIndex;
        const key = `${integer.toString()}${factorIndex}`;
        
        console.debug(`${this.id}: finding next factor of ${quotient}`);
        we.assert.atLevel("ERROR").that("quotient is an integer", quotient.isInteger());

        const factorRequest : NextFactorRequestEvent = {
            status : "factor",
            payload : {
                quotient : quotient.toString(),
                integer : integer.toString(),
                lastFactor : lastFactor ? lastFactor.toString() : ""
            },
            key : key
        };
        
        const webWorkerFactorRequest : WebWorkerRequestData = {
            status : "factor",
            payload : {
                quotient : quotient.toString(),
                integer : integer.toString(),
                lastFactor : lastFactor ? lastFactor.toString() : "",
                integerIndex : this.integerIndex,
                factorIndex : factorIndex
            },
            key : key
        };

        return new Promise((nextFactorResolve) => {
            
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
                const nextFactorRequestHandler = new NextFactorRequestHandler(integer);
                this.nextFactorRequestHandlers.push({
                    handler : nextFactorRequestHandler,
                    integer : integer.toString(),
                    factorIndex : factorIndex.toString(),
                    id : this.id,
                    key : key
                });
                nextFactorRequestHandler.post(factorRequest)
                    .then((response : NextFactorInformationObject) => {
                        if (response.status == "factor" && response.key == key) {
                            console.debug(`${this.id} worker sent message: next factor : ${response.payload.factor}; key : ${response.key}`);
                            if (response.payload.factor) {
                                nextFactorResolve(new Decimal(response.payload.factor));
                            } else {
                                throw new Error("nextFactorRequestHandler did not return a factor");
                            }
                        }
                        if (response.status == "received halt request") {
                            console.debug(`worker received halt request on integer ${response.payload.integer}`);
                        }
                        if (response.status == "halted") {
                            console.debug(`worker halted on ${response.payload.integer}`);
                        }
                        if (response.status == "error") {
                            console.debug(`worker encountered an error`, response.payload.error);
                        }
                    })
                    .catch((e) => {
                        console.error("an unexpected error occured", e);
                    });
            } else if (this.worker instanceof Worker) {
                weKnowThat(`web worker is defined`);
                console.debug(`${this.id} using worker`);
                this.worker.onmessage = (e) => {
                    if (e.data.status == "haltBuilder") {
                        this.workerFactorRequestHaltFunctions.push({
                            halt : () => {
                                console.warn(`halt! integer: ${integer.toString()}; quotient: ${quotient}; key: ${e.data.key}`);
                                (this.worker as Worker).postMessage({
                                    status : "halt",
                                    payload : {
                                        integer : integer.toString(),
                                        integerIndex : this.integerIndex.toString(),
                                        factorIndex : factorIndex.toString()
                                    }
                                });
                            }
                        });
                    }
                    if (e.data.status == "factor" && e.data.key == key) {
                        console.debug(`${this.id} worker sent message: next factor : ${e.data.payload.factor}; key : ${e.data.key}`);
                        nextFactorResolve(new Decimal(e.data.payload.factor));
                    }
                    if (e.data.status == "received halt request") {
                        console.debug(`worker received halt request on integer ${e.data.payload.integer.toString()}`);
                    }
                    if (e.data.status == "halted") {
                        console.debug(`worker halted on ${e.data.payload.integer.toString()}`);
                    }
                    if (e.data.status == "error") {
                        console.debug(`worker encountered an error`, e.data.payload.error);
                    }
                };
                console.warn("posting to worker now");
                this.worker.postMessage(webWorkerFactorRequest);
            } else {
                throw new Error("unexpected Worker error");
            }
        });
    };

    private factorRecursion = async (factoringWorkObject : FactoringWorkObject) : Promise<void> => {
        const integer = factoringWorkObject.primaryInteger;
        const quotient = factoringWorkObject.quotient;
        const lastFactor = factoringWorkObject.lastFactor;
        const factorIndex = factoringWorkObject.factorIndex;
        const observer = factoringWorkObject.observer;
        console.debug(`${this.id}  factor recursion: integer:${integer}; quotient:${quotient};`);
        const one = D(1);
        noteThat(`the base case is when the quotient is 1`);
        if (weHaveThat("the quotient is 1", quotient.equals(one))) {
            return weKnowThat("we have reached the base case", () => {
                return so("let's end the factor recursion", () => {
                    console.debug(`${this.id} reached base case 1: resolving factor recursion;`);
                    return;
                });
            });
        }
        const nextFactor = await this.getNextFactor({
            primaryInteger : integer,
            quotient : quotient,
            lastFactor,
            factorIndex,
            observer
        });
        const newfactorIndex = factorIndex + 1;
        console.log(`${this.id} getNextFactor returned: ${nextFactor}`);
        observer.next({
            "status" : "factor",
            "payload" : {
                "factor" : nextFactor.toString()
            }
        } as FactorEvent);
        const newQuotient = quotient.div(nextFactor);
        weKnowThat(`If we have previously tested the numbers from 2 ... n to check
        if they divide integer, and if they didn't, then we do not need to check
        them again when finding additional factors of integer. Thus:`);
        const newLastFactor = letUs(`keep track of the last factor because when computing the next
        factor after this we can start at lastFactor instead of 2`, () => {
            return nextFactor;
        });
        

        if (typeof this.waitFunction == "function") {
            return await this.waitFunction(() => this.factorRecursion ({
                primaryInteger : integer,
                quotient : newQuotient,
                lastFactor : newLastFactor,
                factorIndex : newfactorIndex,
                observer
            }));
        } else {
            return await this.factorRecursion ({
                primaryInteger : integer,
                quotient : newQuotient,
                lastFactor : newLastFactor,
                factorIndex : newfactorIndex,
                observer
            });
        }
    };

    public factor = (factorRequest : FactorRequest) => {
        noteThat("we are resetting to factor a new inupt value", () => {
            so(`we begin factoring integer : ${factorRequest.integer}`);
        });
        
        we.assert.atLevel("ERROR").that(`input ${factorRequest.integer.toString()} is an integer`, factorRequest.integer.isInteger());

        const setObservableOnSubscriber = (observable : Observable) => {
            factorRequest.subscriber.observable = observable;
        };

        const factorPromise = new Promise((factorResolve, factorReject) => {
            const factorIndex =
                letUs("keep track of which factor we are computing", () => {
                    return 0;
                });
            
            // when someone executes subscribe on the
            // observable, that fires the factorRecursion
            // to find the next factor

            const observable = new Observable((observer : Observer) => {
                console.log(`${this.id} starting factorRecursion`);
                this.factorRecursion({
                    primaryInteger : factorRequest.integer.toString(),
                    quotient : factorRequest.integer,
                    lastFactor : undefined,
                    factorIndex,
                    observer
                })
                    .then(() => {
                        console.debug(`${this.id} sending success event`);
                        observer.next({
                            status : "success",
                            payload : {}
                        });
                        factorResolve("success");
                    })
                    .catch((e) => {
                        
                        if (e == "halt") {
                            console.debug(`${this.id} halt`);
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
        return factorPromise;
    };
    
    public halt () {
        console.warn("calling factorizer halt function");
        for (const nextfactorRequestHandler of this.nextFactorRequestHandlers) {
            console.warn(`calling halt function on ${nextfactorRequestHandler.integer}`);
            nextfactorRequestHandler.handler.halt();
        }
        since("we have halted all factor requests in this.nextFactorRequestHandlers", () => {
            letUs("remove them all", () => {
                this.nextFactorRequestHandlers = [];
            });
        });
        for (const haltFunctionObj of this.workerFactorRequestHaltFunctions) {
            haltFunctionObj.halt();
        }
        since("we have halted all factor requests in haltFunctionObj", () => {
            letUs("remove them all", () => {
                this.workerFactorRequestHaltFunctions = [];
            });
        });
    }

    public getId () {
        return this.id;
    }
}
export default Factorizer;