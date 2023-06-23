import Factorizer from "../src/Factorizer";
import Decimal from "decimal.js";
import WeAssert from "we-assert";

// to get a new scoped factor function define 
// factor = factorizer()
// factor takes arguments (integer, workerIn, waitFunctionIn, subscriber)
// integer is a Decimal object from decimal.js
const we = WeAssert.build();
we.setLevel("DEBUG");
we.setHandler((message, payload) => {
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

const testFunction = function (configObject, timeout) {
    return new Promise((resolve, reject) => {
        const integer = new Decimal(configObject.integer);
        we.assert.atLevel("ERROR").that("right now factor is undefined", factor === undefined);
        const factor = new Factorizer().factor; // each factor function has its own scope
        const subscriber = {};
        factor(integer, configObject.worker, configObject.waitFunction, subscriber);
        // factor adds the observable object to the subscriber
        // object passed into it
        we.assert.atLevel("ERROR").that("subscriber now has observable object defined", subscriber.observable !== undefined);
        let factorEventIndex = 0;
        const resultFactors = [];
        const timeoutId = setTimeout(() => {
            reject();
        }, timeout || 500);
        subscriber.observable.subscribe((event) => {
            console.log("event", event);
            if (event.status === "factor") {
                resultFactors[factorEventIndex] = event.payload.factor;
                factorEventIndex++;
            }
            if (event.status === "success") {
                clearTimeout(timeoutId);
                resolve(resultFactors);
            }
        });
        
    });
};

describe("no web worker", () => {
    describe("no wait function", () => {
        test("finds first factor of 2 is 2", async () => {
            const resultFactors = await testFunction({
                integer : new Decimal(2)
            });
            expect(resultFactors[0].equals(new Decimal(2))).toBeTruthy();
        });
        test("finds first factor of 3 is 3", async () => {
            const resultFactors = await testFunction({
                integer : new Decimal(3)
            });
            expect(resultFactors[0].equals(new Decimal(3))).toBeTruthy();
        });
        test("finds first factor of 15 is 3", async () => {
            const resultFactors = await testFunction({
                integer : new Decimal(3)
            });
            expect(resultFactors[0].equals(new Decimal(3))).toBeTruthy();
        });
        test("factors of 25 are (5)(5)", async () => {
            const resultFactors = await testFunction({
                integer : new Decimal(25)
            });
            expect(resultFactors[0].equals(new Decimal(5))).toBeTruthy();
            expect(resultFactors[1].equals(new Decimal(5))).toBeTruthy();
        });
        test("finds second factor of 15 is 5", async () => {
            const resultFactors = await testFunction({
                integer : new Decimal(15)
            });
            expect(resultFactors[1].equals(new Decimal(5))).toBeTruthy();
        });
        // 7883 is prime
        test("finds first factor of 7883 is 7883", async () => {
            const resultFactors = await testFunction({
                integer : new Decimal(7883)
            });
            expect(resultFactors[0].equals(new Decimal(7883))).toBeTruthy();
        });
    });
    describe("with wait function", () => {
        test("factors of 25 are (5)(5)", async () => {
            const waitFun = (inputFunction) => {
                inputFunction();
            };
            const resultFactors = await testFunction({
                integer : new Decimal(25),
                waitFunction : waitFun
            });
            expect(resultFactors[0].equals(new Decimal(5))).toBeTruthy();
            expect(resultFactors[1].equals(new Decimal(5))).toBeTruthy();
        });
    });
});