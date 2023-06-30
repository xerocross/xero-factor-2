import Decimal from "decimal.js";
import WeAssert from "we-assert";
import DataIs from "@xerocross/data-is";

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
    const D = (x) => {
        return new Decimal(x);
    };

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
        let lastIntegerTested;
        
        function doComputation (start, quotient, isHalt) {
            /*
            * setup initial computation values
            */
            
            const squareRoot = quotient.squareRoot();
            const max = squareRoot.ceil().plus(D(1));
            // mathematically, the smallest factor of quotient is now < max

            /*
            * For large numbers, we divide the work up into subintervals so that
            * there will be at most 1000 subintervals before finding the next factor.
            * If the total number of possible divisors we have to check is small
            *  (< 1000) then we default to using just one interval of length 1000.
            */
            const length = max.minus(start);
            const intervalLength = Decimal.max(length.div(D(1000)).floor(), D(1000));
            let intervalIndex = 0;
            
            
            
            function computeSubinterval (quotient, start, end, intervalLength) {
                console.debug(`computeSubinterval quotient: ${quotient}; start: ${start}; end: ${end}; intervalLength: ${intervalLength}; max: ${max}`);
                return new Promise((resolve, reject) => {
                    let i = start;
                    if (i.greaterThanOrEqualTo(max)) {
                        console.debug(`found i:${i} >= max:${max}`);
                        /*
                        * Reaching this line implies that no divisor of the quotient has been found
                        * from start until max, which implies that quotient is prime. Thus quotient
                        * itself is the next factor.
                        */
                        resolve({status : "factor", payload : {"factor" : quotient.toString() }});
                    } else {
                        setTimeout(() => {
                            while(i.lessThan(end)) {
                                if (lastIntegerTested) {
                                    if (!lastIntegerTested.plus(D(1)).equals(i)) {
                                        reject(new Error(`a number was skipped: testing ${i} but last tested number was ${lastIntegerTested}!`));
                                    }
                                }
                                let test = quotient.modulo(i).equals(0);
                                if (test) {
                                    resolve({status : "factor", payload : {"factor" : i.toString() }});
                                    return;
                                }
                                lastIntegerTested = i;
                                i = i.add(1);
                                
                            }
                            if (!isHalt()) {
                                intervalIndex++;
                                console.debug(`NOW INTERVALINDEX IS ${intervalIndex}`);
                                resolve(computeSubinterval(quotient, end, end.plus(intervalLength), intervalLength));
                            } else {
                                console.debug(`successfully halted: ${event.data.payload.integer}`);
                                resolve({
                                    status : "halted",
                                    payload : {
                                        "message" : `successfully halted: ${event.data.payload.integer}`,
                                        "integer" : event.data.payload.integer
                                    }
                                });
                            }
                        }, 0);
                    }
                });
            }
            
            return computeSubinterval(quotient, start, start.plus(intervalLength), intervalLength);
        }
        
        

        if (event.data.status === "factor") {

            /*
            * read input and set up for factoring
            */

            let halt = false; // 
            const haltFunction = () => {
                halt = true;
            };
            const isHalt = () => {
                return halt;
            };
            factorEvents[event.data.payload.integer] = {
                halt : haltFunction
            };
            let quotient;
            let lastFactor;
            let start;
            lastIntegerTested = undefined;
            try {
                we.assert.atLevel("DEBUG").that(data(event.data.payload.quotient).is.a("positive integer"));
                quotient = D(event.data.payload.quotient);
                
                lastFactor;
                if (event.data.payload.lastFactor === "") {
                    lastFactor = D(1);
                } else {
                    we.assert.atLevel("ERROR").that(data(event.data.payload.lastFactor).is.a("positive integer"));
                    lastFactor = D(event.data.payload.lastFactor);
                }
                start = Decimal.max(D(2), lastFactor);
            } catch (e) {
                return Promise.resolve({
                    status : "error",
                    payload : {
                        "error" : e,
                        "message" : "encountered an error while reading inputs"
                    }
                });
            }



            console.log(`starting doComputation`);
            return doComputation(start, quotient, isHalt)
                .then((result) => {
                    console.log("result", result);
                    return {
                        status : result.status,
                        payload : result.payload,
                        key : event.data.key
                    };
                })
                .catch((e) => {
                    if (e === "halt") {
                        return {
                            status : "halted",
                            payload : {
                                "integer" : event.data.payload.integer
                                
                            },
                            "key" : event.data.key
                        };
                    } else {
                        return {
                            status : "error",
                            payload : {
                                "error" : e,
                                "integer" : event.data.payload.integer
                            },
                            key : event.data.key
                        };
                    }
                });
        } else if (event.data.status === "halt") {
            console.debug(`received request to halt ${event.data.payload.integer}; attempting`);
            if (factorEvents[event.data.payload.integer]) {
                console.debug(`ATTEMPTING TO HALT ${event.data.payload.integer}`);
                factorEvents[event.data.payload.integer].halt();
            }
            return Promise.resolve({
                status : "received halt request",
                payload : {
                    "integer" : event.data.payload.integer
                }
            });
        } else {
            throw new Error("received unexpected event");
        }
    };
};
export default FactorRequestHandler;