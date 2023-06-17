
importScripts("decimal.js");

let factorEvents = {};

function handleFactorRequest (event) {
    let lastIntegerTested;
    let halt = false;

    const haltFunction = () => {
        halt = true;
    };
    factorEvents[event.data.payload.integer] = {
        halt : haltFunction
    };
    function doComputation (start, quotient) {
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
                    resolve({"factor" : quotient });
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
                                resolve({"factor" : i });
                                return;
                            }
                            lastIntegerTested = i;
                            i = i.add(1);
                            
                        }
                        if (!halt) {
                            intervalIndex++;
                            console.debug(`NOW INTERVALINDEX IS ${intervalIndex}`);
                            resolve(computeSubinterval(quotient, end, end.plus(intervalLength), intervalLength));
                        } else {
                            reject("halt");
                        }
                    }, 0);
                }
            });
        }
        
        return computeSubinterval(quotient, start, start.plus(intervalLength), intervalLength);
    }
    const quotient = new Decimal(event.data.payload.quotient);
    lastIntegerTested = undefined;
    let lastFactor;
    if (event.data.payload.lastFactor === "") {
        lastFactor = new Decimal(1);
    } else {
        lastFactor = new Decimal(event.data.payload.lastFactor);
    }
    let start = Decimal.max(new Decimal(2), lastFactor);
    console.log(`starting doComputation`);
        
        
        
        
        
    doComputation(start, quotient)
        .then((result) => {
            console.log("result", result);
            self.postMessage({
                status : "factor",
                payload : {
                    "factor" : result.factor.toString()
                },
                key : event.data.key
            });
        })
        .catch((e) => {
            if (e === "halt") {
                self.postMessage({
                    status : "halted",
                    payload : {
                        "integer" : event.data.payload.integer
                        
                    },
                    "key" : event.data.key
                });
            } else {
                self.postMessage({
                    status : "error",
                    payload : {
                        "error" : e,
                        "integer" : event.data.payload.integer
                    },
                    key : event.data.key
                });
            }
        });
}

self.addEventListener("message", function (event) {

    if (event.data.status === "halt") {
        console.debug(`received request to halt ${event.data.payload.integer}; attempting`);
        if (factorEvents[event.data.payload.integer]) {
            factorEvents[event.data.payload.integer].halt();
        }
        self.postMessage({
            status : "received halt request",
            payload : {
                "integer" : event.data.payload.integer
            }
        });
    }

    if (event.data.status === "factor") {
        handleFactorRequest(event);
        // eslint is mistaken no below line
        // eslint-disable-next-line no-unused-vars   
    }
});



