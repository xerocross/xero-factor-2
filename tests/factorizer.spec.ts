import Factorizer from "../src/Factorizer";
import Decimal from "decimal.js";
import WeAssert from "we-assert";
import type { QueryObject } from "../src/QueryObject";
import type { WaitFunction } from "../src/WaitFunction";
import type { Subscriber, ObservableEvent } from "../src/Observable.d";

// to get a new scoped factor function define 
// factor = factorizer()
// factor takes arguments (integer, workerIn, waitFunctionIn, subscriber)
// integer is a Decimal object from decimal.js
const we = WeAssert.build();
we.setLevel("DEBUG");
we.setHandler((message, level, payload) => {
    console.log(`validation failed: ${message}`);
    if (payload && payload.error) {
        console.log(payload.error);
    }
});

// let configObject = {
//     integer,
//     worker,
//     waitFunction,
// };

interface ConfigObject {
    integer : Decimal
    waitFunction ?: WaitFunction
}

const testFunction = function (configObject : ConfigObject, timeout ?: number) : Promise<string[]> {
    return new Promise((resolve, reject) => {
        const integer = new Decimal(configObject.integer);
        const queryObject : QueryObject = {};
        const worker = null;
        const factorizer = new Factorizer(queryObject, worker);
        if (configObject.waitFunction) {
            factorizer.setWaitFunction(configObject.waitFunction);
        }
        const factor = factorizer.factor; // each factor function has its own scope
        const subscriber : Subscriber = {
            cancel : () => {},
            observable : {
                subscribe : () => {
                    console.error("the subscriber object was not properly mutated");
                },
                cancel : () => {}
            }
        };
        // export interface FactorRequest {
        //     integer : Decimal, 
        //     waitFunctionIn : WaitFunction, 
        //     subscriber : Subscriber,
        //     id : string
        // }
        factor({
            integer, 
            subscriber
        });
        // factor adds the observable object to the subscriber
        // object passed into it
        let factorEventIndex = 0;
        const resultFactors : string[] = [];
        const timeoutId = setTimeout(() => {
            reject();
        }, timeout || 500);
        subscriber.observable.subscribe((event : ObservableEvent) => {
            console.log("event", event);
            if (event.status == "factor") {
                resultFactors[factorEventIndex] = event.payload.factor;
                factorEventIndex++;
            }
            if (event.status == "success") {
                clearTimeout(timeoutId);
                resolve(resultFactors);
            }
        });
    });
};

describe("no web worker", () => {
    describe("no wait function", () => {
        test("finds first factor of 2 is 2", async () => {
            const resultFactors : string[] = await testFunction({
                integer : new Decimal(2)
            });
            expect(resultFactors[0]).toBe("2");
        });
        test("finds first factor of 3 is 3", async () => {
            const resultFactors = await testFunction({
                integer : new Decimal(3)
            });
            expect(resultFactors[0]).toBe("3");
        });
        test("finds first factor of 15 is 3", async () => {
            const resultFactors = await testFunction({
                integer : new Decimal(3)
            });
            expect(resultFactors[0]).toBe("3");
        });
        test("factors of 25 are (5)(5)", async () => {
            const resultFactors = await testFunction({
                integer : new Decimal(25)
            });
            expect(resultFactors[0]).toBe("5");
            expect(resultFactors[1]).toBe("5");
        });
        test("finds second factor of 15 is 5", async () => {
            const resultFactors = await testFunction({
                integer : new Decimal(15)
            });
            expect(resultFactors[1]).toBe("5");
        });
        // 7883 is prime
        test("finds first factor of 7883 is 7883", async () => {
            const resultFactors = await testFunction({
                integer : new Decimal(7883)
            });
            expect(resultFactors[0]).toBe("7883");
        });
    });
    describe("with wait function", () => {
        test("factors of 25 are (5)(5)", async () => {
            const waitFun : WaitFunction = (inputFunction : ((...args : any) => void)) => {
                return Promise.resolve(inputFunction());
            };
            const resultFactors = await testFunction({
                integer : new Decimal(25),
                waitFunction : waitFun
            });
            expect(resultFactors[0]).toBe("5");
            expect(resultFactors[1]).toBe("5");
        });
    });
});