import NextFactorRequestHandler from "../src/NextFactorRequestHandler";

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
    const integer  = "15";
    const nextFactorRequestHandler = new NextFactorRequestHandler(integer);
    nextFactorRequestHandler.post({
        status : "factor",
        payload : {
            integer : "15",
            quotient : "15",
            lastFactor : ""
        },
        key : ""
    }).then((result) => {
        expect(result.payload.factor).toBe("3");
        done();
    });
});
it("returns that the first factor of 7 is 7", (done) => {
    const integer  = "7";
    const nextFactorRequestHandler = new NextFactorRequestHandler(integer);
    nextFactorRequestHandler.post({
        status : "factor",
        payload : {
            integer : "7",
            quotient : "7",
            lastFactor : ""
        },
        key : ""
    }).then((result) => {
        expect(result.payload.factor).toBe("7");
        done();
    });
});
it("returns successful halt on halt request", (done) => {
    const integer  = "58971478991679167";
    const nextFactorRequestHandler = new NextFactorRequestHandler(integer);
    nextFactorRequestHandler.post({
        status : "factor",
        payload : {
            integer : "58971478991679167",
            quotient : "58971478991679167",
            lastFactor : ""
        },
        key : ""
    }).then((result) => {
        expect(result.status).toBe("halted");
        done();
    });
    nextFactorRequestHandler.post({
        status : "halt",
        payload : {
            integer : "58971478991679167",
            quotient : "",
            lastFactor : ""
        },
        key : ""
    });
});