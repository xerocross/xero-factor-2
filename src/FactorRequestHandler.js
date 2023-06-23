import Decimal from "decimal.js";
const FactorRequestHandler = function () {
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
            const squareRoot = quotient.squareRoot();
            const max = squareRoot.ceil().plus(new Decimal(1));
            const length = max.minus(start);
            const intervalLength = Decimal.max(length.div(new Decimal(1000)).floor(), new Decimal(1000));
            let intervalIndex = 0;
            function computeSubinterval (quotient, start, end, intervalLength) {
                console.debug(`COMPUTING SUBINTERVAL ${intervalIndex}`);

                console.debug(`computeSubinterval quotient: ${quotient}; start: ${start}; end: ${end}; intervalLength: ${intervalLength}; max: ${max}`);
                return new Promise((resolve, reject) => {
                    console.debug(`inside promise: quotient: ${quotient}; start: ${start}; max: ${max}`);
                    let i = start;
                    if (i.greaterThanOrEqualTo(max)) {
                        console.debug(`found i:${i} >= max:${max}`);
                        // quotient is prime
                        resolve({status : "factor", payload : {"factor" : quotient.toString() }});
                    } else {
                        setTimeout(() => {
                            while(i.lessThan(end)) {
                                if (lastIntegerTested) {
                                    if (!lastIntegerTested.plus(new Decimal(1)).equals(i)) {
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
            let quotient;
            let lastFactor;
            let start;
            try {
                quotient = new Decimal(event.data.payload.quotient);
                lastIntegerTested = undefined;
                lastFactor;
                if (event.data.payload.lastFactor === "") {
                    lastFactor = new Decimal(1);
                } else {
                    lastFactor = new Decimal(event.data.payload.lastFactor);
                }
                start = Decimal.max(new Decimal(2), lastFactor);
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