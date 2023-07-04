import Decimal from "decimal.js";
import WeAssert from "we-assert";
import DataIs from "@xerocross/data-is";
import { check, since, weKnowThat, letUs, weHave, weHaveThat } from "@xerocross/literate";
import Scheduler from "./Scheduler";
import type { FactoringEvent } from "./Factorizer.d";
import { v4 as uuidv4 } from "uuid";

const { D } 
    = letUs("define Decimal alias", () => {
        const D = (x : string) => {
            return new Decimal(x);
        };
        return  { D };
    });

    interface NextFactorResult {
        status : string,
        payload : {
            [key : string] : any
        },
        key : string
    }

class NextFactorRequestHandler {
    
    public constructor (integer : Decimal) {
        this.data = DataIs.build();
        this.we = WeAssert.build();
        this.integer = integer;
        this.data.define.type("positive integer", (x : any) => {
            try {
                const pattern = /^[1-9]+\d*$/;
                return pattern.test(x);
            } catch (e) {
                return false;
            }
        });
        this.id = uuidv4();
    }
    private we;
    private data;
    private isReceivedHaltRequest : boolean;
    private integer : Decimal;
    private id : string;


    private findNextFactor = (globalFirst : Decimal, quotient : Decimal) => {
        let lastIntegerTested : Decimal;
        let foundNextFactor = false;
        console.log(`doComputation: ${quotient}.`);
        const { globalMax, intervalLength} 
        = letUs("compute some initial values for the computation", () => {
            const squareRoot = quotient.squareRoot();
            const globalMax = squareRoot.ceil().plus(D(1));
            weKnowThat("mathematically, the smallest factor of quotient is < globalMax");
            /*
            * For large numbers, we divide the work up into subintervals so that
            * there will be at most 1000 subintervals before finding the next factor.
            * If the total number of possible divisors we have to check is small
            *  (< 1000) then we default to using just one interval of length 1000.
            */
            const totalComputationLength = globalMax.minus(globalFirst);
            const intervalLength = Decimal.max(totalComputationLength.div(D(1000)).floor(), D(1000));
            return { globalMax, intervalLength};
        });
        
        const computeSubinterval = (quotient : Decimal, initialValueOfSubinterval : Decimal, subintervalMax : Decimal, intervalLength : Decimal) => {
            console.debug(`computeSubinterval quotient: ${quotient}; start: ${initialValueOfSubinterval}; end: ${subintervalMax}; intervalLength: ${intervalLength}; globalMax: ${globalMax}`);
            return new Promise((resolve) => {
                let i = initialValueOfSubinterval;
                if (weHave("i >= global max", i.greaterThanOrEqualTo(globalMax))) {
                    console.debug(`found i:${i} >= globalMax:${globalMax}`);
                    weKnowThat(`no divisor of quotient has been found from
                    start until max, which implies that quotient is prime`);
                    since("quotient is prime", () => {
                        letUs("return that the only factor of quotient is quotient", () => {
                            resolve({status : "factor", payload : {"factor" : quotient.toString() }});
                            foundNextFactor = true;
                        });
                    });
                } else {
                    letUs("schedule the main division computation for this subinterval", () => {
                        new Scheduler().schedule(() => {
                            letUs("find the smallest i in the subinterval, if any, that divides the quotient", () => {
                                for (; i.lessThan(subintervalMax); i = i.plus(D(1))) {
                                    this.we.assert.atLevel("ERROR").that("after i = globalFirst, then i = lastIntegerTested + 1", i == globalFirst || lastIntegerTested.plus(D(1)).equals(i));
                                    
                                    const iDividesQuotient = quotient.modulo(i).equals(0);
                                    if (weHaveThat("i is a factor of quotient", iDividesQuotient)) {
                                        letUs("send i back as first factor", () => {
                                            resolve({status : "factor", payload : {"factor" : i.toString() }});
                                            foundNextFactor = true;
                                            lastIntegerTested = i;
                                        });
                                        break;
                                    }

                                    since("we want to make sure we don't accidentally skip any number", () => {
                                        letUs("keep track of this number for comparison in the next iteration", () => {
                                            lastIntegerTested = i;
                                        });
                                        
                                    });
                                }
                            });
                            if (weHaveThat("factoring has been halted", this.isReceivedHaltRequest)) {
                                weKnowThat("that the factor request has received a halt request");
                                console.debug(`successfully halted: ${this.integer}`);
                                since("the factoring function is not recursing", () => {
                                    letUs(`post message to main thread confirming halt for the current integer`, () => {
                                        const { integer } 
                                        = {"integer" : this.integer };
                                        resolve({
                                            status : "halted",
                                            payload : {
                                                "message" : `successfully halted: ${integer}`,
                                                "integer" : integer
                                            }
                                        });
                                    });
                                });
                            } else {
                                weKnowThat("factoring has not been halted");
                                if (check("the next factor has not been found", !foundNextFactor)) {
                                    since("factoring needs to continue", () => {
                                        letUs("recurse down to continue to the next subinterval", () => {
                                            resolve(computeSubinterval(quotient, subintervalMax, subintervalMax.plus(intervalLength), intervalLength));
                                        });
                                    });
                                }
                            }
                        }, {});
                    });
                }
            });
        };
        return letUs("kick off computation to find the first factor", () => {
            return computeSubinterval(quotient, globalFirst, globalFirst.plus(intervalLength), intervalLength);
        });
    };


    public post (event : FactoringEvent) {
        console.debug("called FactorRequestHandler:post");
        if (weHave("the caller posted a next factor request", event.status == "factor")) {
            this.isReceivedHaltRequest = false;
            let quotient : Decimal, initialValue : Decimal;
            try {
                ({quotient, initialValue} 
                    = letUs("setup values for interval computation", () => {
                        this.we.assert.atLevel("DEBUG").that("quotient is a pos integer", this.data(event.payload.quotient).is.a("positive integer"));
                        const quotient = D(event.payload.quotient);
                        const { lastFactor } 
                        = since("there is no need to check values smaller than the last factor", () => {
                            return letUs("validate and handle the last factor if sent by the main thread", () => {
                                let lastFactor : Decimal;
                                if (event.payload.lastFactor == "") {
                                    lastFactor = D(1);
                                } else {
                                    this.we.assert.atLevel("ERROR").that("lastFactor is a pos integer", this.data(event.payload.lastFactor).is.a("positive integer"));
                                    lastFactor = D(event.payload.lastFactor);
                                }
                                return { lastFactor };
                            });
                        });
                        const initialValue = Decimal.max(D(2), lastFactor);
                        return {quotient, initialValue};
                    }));
            } catch (e) {
                return since("we encountered an error during the basic setup of the computation", () => {
                    return letUs("return the error to the caller", () => {
                        return Promise.resolve({
                            "status" : "error",
                            "payload" : {
                                "error" : e,
                                "message" : "encountered an error while reading inputs"
                            }
                        });
                    });
                });
            }

            console.log(`starting doComputation`);
            return letUs("start executing computation recursion", () => {
                return this.findNextFactor(initialValue, quotient)
                    .then(
                        since("next factor computation is finished", () => {
                            return letUs("send next factor results back", () => {
                                return (result : NextFactorResult) => {
                                    return {
                                        status : result.status,
                                        payload : result.payload,
                                        key : event.key
                                    };
                                };
                            });
                        })
                    )
                    .catch((e) => {
                        if (weHave("exception was a halt request, not an error", e == "halt")) {
                            return {
                                "status" : "halted",
                                "payload" : {
                                    "integer" : event.payload.integer
                                    
                                },
                                "key" : event.key
                            };
                        } else {
                            return {
                                "status" : "error",
                                "payload" : {
                                    "error" : e,
                                    "integer" : event.payload.integer
                                },
                                "key" : event.key
                            };
                        }
                    });
            });
        } else if (weHave("the caller sent a halt request", event.status == "halt")) {
            console.debug(`received request to halt factring primary integer: ${this.integer}; attempting`);

            console.debug(`ATTEMPTING TO HALT ${event.payload.integer}`);
            letUs("execute a halt function to stop factoring", () => {
                this.haltComputation();
            });
            return Promise.resolve({
                status : "received halt request",
                payload : {
                    "integer" : event.payload.integer
                }
            });
        } else {
            weKnowThat("A totally unexpected programming error has occurred");
            throw new Error("received unexpected event");
        }
    }

    private haltComputation () {
        this.isReceivedHaltRequest = true;
    }

    public halt () {
        this.isReceivedHaltRequest = true;
    }

    public getId () {
        return this.id;
    }
}
export default NextFactorRequestHandler;