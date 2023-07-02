import Decimal from "decimal.js";
import WeAssert from "we-assert";
import DataIs from "@xerocross/data-is";
import { check, since, weKnowThat, given, letUs, weHave } from "@xerocross/literate";
import Scheduler from "./Scheduler";

const { D } 
= letUs("define Decimal alias", () => {
    const D = (x) => {
        return new Decimal(x);
    };
    return  { D };
});

const FactorRequestHandler = function () {
    const we = WeAssert.build();
    const data = DataIs.build();
    data.define.type("positive integer", (x) => {
        try {
            const pattern = /^\d+$/;
            return pattern.test(x);
        } catch (e) {
            return false;
        }
    });


    let factorEvents = {};
    this.post = function (event) {
        console.debug("called FactorRequestHandler:post");
        // event = {
        //     status : "factor",
        //     payload : {
        //         integer : "[integer]",
        //         lastFactor : "[lastFactor]",
        //         quotient : "[quotient]"
        //     }
        // }
        
        function findNextFactor (globalFirst, quotient, isHalt) {
            let lastIntegerTested;
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
            
            function computeSubinterval (quotient, initialValueOfSubinterval, subintervalMax, intervalLength) {
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
                                        try {
                                            we.assert.atLevel("ERROR").that("after i = globalFirst, then i = lastIntegerTested + 1", i == globalFirst || lastIntegerTested.plus(D(1)).equals(i));
                                        }
                                        catch(e) {
                                            console.error(`i: ${i}; quotient: ${quotient}; lastCheckedNumber: ${lastIntegerTested}; globalFirst: ${globalFirst}`);
                                        }
                                        let iDividesQuotient = quotient.modulo(i).equals(0);
                                        if (check("i is a factor of quotient", iDividesQuotient)) {
                                            letUs("send i back as first factor", () => {
                                                resolve({status : "factor", payload : {"factor" : i.toString() }});
                                                foundNextFactor = true;
                                                lastIntegerTested = i;
                                            });
                                            break;
                                        }
                                        since("we want to make sure we don't accidentally skip any number", () => {
                                            lastIntegerTested = i;
                                        });
                                    }
                                });
                                if (check("factoring has been halted", isHalt())) {
                                    weKnowThat("that the factor request has received a halt request");
                                    console.debug(`successfully halted: ${event.data.payload.integer}`);
                                    since("the factoring function is not recursing", () => {
                                        letUs(`post message to main thread confirming halt for the current integer`, () => {
                                            const { integer } 
                                            = {"integer" : event.data.payload.integer };
                                            resolve({
                                                status : "halted",
                                                payload : {
                                                    "message" : `successfully halted: ${integer}`,
                                                    "integer" : integer
                                                }
                                            }
                                            );
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
            }
            return letUs("kick off computation to find the first factor", () => {
                return computeSubinterval(quotient, globalFirst, globalFirst.plus(intervalLength), intervalLength);
            });
        }
        
        if (weHave("the main thread has posted a next factor request", event.data.status === "factor")) {
            const { isHalt } = 
            letUs("set up halt function for this integer factoring", () => {
                let halt = false;
                const haltFunction = () => {
                    halt = true;
                };
                const isHalt = () => {
                    return halt;
                };
                factorEvents[event.data.payload.integer] = {
                    halt : haltFunction
                };
                return { isHalt };
            });
            
            try {
                let {quotient, initialValue} 
                = letUs("setup values for interval computation", () => {
                    we.assert.atLevel("DEBUG").that(data(event.data.payload.quotient).is.a("positive integer"));
                    let quotient = D(event.data.payload.quotient);
                    let { lastFactor } 
                    = since("there is no need to check values smaller than the last factor", () => {
                        return letUs("validate and handle the last factor if sent by the main thread", () => {
                            let lastFactor;
                            if (event.data.payload.lastFactor === "") {
                                lastFactor = D(1);
                            } else {
                                we.assert.atLevel("ERROR").that(data(event.data.payload.lastFactor).is.a("positive integer"));
                                lastFactor = D(event.data.payload.lastFactor);
                            }
                            return { lastFactor };
                        });
                    });
                    let initialValue = Decimal.max(D(2), lastFactor);
                    return {quotient, initialValue};
                }));
            } catch (e) {
                return since("we encountered an error during the basic setup of the computation", () => {
                    return letUs("return the error to the main thread", () => {
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
                return findNextFactor(initialValue, quotient, isHalt)
                    .then(
                        since("next factor computation is finished", () => {
                            return letUs("send next factor result back to main thread", () => {
                                return (result) => {
                                    return {
                                        status : result.status,
                                        payload : result.payload,
                                        key : event.data.key
                                    };
                                };
                            });
                        })
                    )
                    .catch((e) => {
                        if (weHave("exception was a halt request, not an error", e === "halt")) {
                            return {
                                "status" : "halted",
                                "payload" : {
                                    "integer" : event.data.payload.integer
                                    
                                },
                                "key" : event.data.key
                            };
                        } else {
                            return {
                                "status" : "error",
                                "payload" : {
                                    "error" : e,
                                    "integer" : event.data.payload.integer
                                },
                                "key" : event.data.key
                            };
                        }
                    });
            });
        } else if (weHave("the main thread sent a halt request", event.data.status === "halt")) {
            console.debug(`received request to halt ${event.data.payload.integer}; attempting`);
            given("the handler has received a request to halt", factorEvents[event.data.payload.integer], () => {
                console.debug(`ATTEMPTING TO HALT ${event.data.payload.integer}`);
                letUs("execute a halt function to stop factoring", () => {
                    factorEvents[event.data.payload.integer].halt();
                });
            });
            return Promise.resolve({
                status : "received halt request",
                payload : {
                    "integer" : event.data.payload.integer
                }
            });
        } else {
            weKnowThat("A totally unexpected programming error has occurred");
            throw new Error("received unexpected event");
        }
    };
};
export default FactorRequestHandler;