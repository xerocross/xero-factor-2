import NextFactorRequestHandler from "../src/NextFactorRequestHandler";
import Decimal from "decimal.js";

// status : string,
// id : string,
// payload : { 
//     integer ?: string,
//     lastFactor ?: string,
//     quotient ?: string,
//     integerIndex : string,
//     factorIndex : string
//  },
//  key : string,

it("returns that the first factor of 15 is 3", (done) => {
    const integer  = new Decimal("15");
    const nextFactorRequestHandler = new NextFactorRequestHandler(integer);
    nextFactorRequestHandler.post({
        status : "factor",
        id : "",
        payload : {
            integer : "15",
            quotient : "15",
            lastFactor : "",
            integerIndex : "1",
            factorIndex : "1"
        },
        key : ""
    }).then((result) => {
        expect(result.payload.factor).toBe("3");
        done();
    });
});
it("returns that the first factor of 7 is 7", (done) => {
    const integer  = new Decimal("7");
    const nextFactorRequestHandler = new NextFactorRequestHandler(integer);
    nextFactorRequestHandler.post({
        status : "factor",
        id : "",
        payload : {
            integer : "7",
            quotient : "7",
            lastFactor : "",
            integerIndex : "1",
            factorIndex : "1"
        },
        key : ""
    }).then((result) => {
        expect(result.payload.factor).toBe("7");
        done();
    });
});
it("returns successful halt on halt request", (done) => {
    const integer  = new Decimal("58971478991679167");
    const nextFactorRequestHandler = new NextFactorRequestHandler(integer);
    nextFactorRequestHandler.post({
        status : "factor",
        id : "",
        payload : {
            integer : "58971478991679167",
            quotient : "58971478991679167",
            lastFactor : "",
            integerIndex : "1",
            factorIndex : "1"
        },
        key : ""
    }).then((result) => {
        expect(result.status).toBe("halted");
        done();
    });
    nextFactorRequestHandler.post({
        status : "halt",
        id : "",
        payload : {
            integer : "58971478991679167",
            quotient : "",
            lastFactor : "",
            integerIndex : "1",
            factorIndex : "1"
        },
        key : ""
    });
});