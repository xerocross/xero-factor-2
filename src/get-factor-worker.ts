
import NextFactorRequestHandler from "./NextFactorRequestHandler";
import { weKnowThat, letUs, so, noteThat } from "@xerocross/literate";

const nextFactorRequestHandlers = {};

noteThat(`There will be just one instance of this script
executing at runtime: it is a singleton.`);
weKnowThat(`We want a new and independent instance of NextFactorRequestHandler
for each request to find the next factor of an integer.`);
weKnowThat(`In theory an integer could be repeated within the lifetime
of the app.`);
noteThat(`We define a new integerIndex for each validated user input, 
and each attempt to find the next factor of a given input increments
the factorIndex by 1 (to be reset back to 0 each time factor is called
    on a new validated input).`);
so(`A key of the form key="[integerIndex][integer][factorIndex]" uniquely
identifies a next factor request within the lifetime of the app.`);
noteThat(`In fact adding [integer] to the key is redundant, but it 
is added for good measure and to help avoid potential future errors.`);

self.addEventListener("message", function (event) {
    console.warn("inside main web worker event listener");
    let nextFactorRequestHandler : NextFactorRequestHandler;
    let key : string;
    try {
        const integer = event.data.payload.integer;
        const integerIndex = event.data.payload.integerIndex;
        const factorIndex = event.data.payload.factorIndex;
        
        key = "" + integerIndex + integer + factorIndex;
        
        if (!(nextFactorRequestHandlers[key] instanceof NextFactorRequestHandler)) {
            nextFactorRequestHandler = new NextFactorRequestHandler(integer);
            console.warn(`created NextFactorRequestHandler with key ${key}`);
            nextFactorRequestHandlers[key] = nextFactorRequestHandler;
        } else {
            console.warn(`retrieved NextFactorRequestHandler with key ${key}`);
            nextFactorRequestHandler = nextFactorRequestHandlers[key];
        }
    }
    catch (e) {
        throw new Error("An error occurred in reading values into web worker");
    }

    noteThat(`Here we pass the event data into nextFactorRequestHandler
    for processing.`);
    nextFactorRequestHandler.post(event.data)
        .then((resultEvent) => {
            self.postMessage(resultEvent);
        })
        .catch((e) => {
            self.postMessage({
                status : "error",
                payload : {
                    "error" : e,
                    "integer" : event.data.payload.integer
                }
            });
        });

    letUs(`send back a message to create a halt function for this NextFactorRequestHandler`, () => {
        self.postMessage({
            status : "haltBuilder",
            payload : {
                haltId : nextFactorRequestHandler.getId()
            },
            key : key
        });
    });
    
});
self.addEventListener("message", function (event) {
    console.warn("inside halt web worker event listener");
    if (event.data.status == "halt") {
        let nextFactorRequestHandler : NextFactorRequestHandler;
        try {
            const integer = event.data.payload.integer;
            const integerIndex = event.data.payload.integerIndex;
            const factorIndex = event.data.payload.factorIndex;
            noteThat(`each NextFactorRequestHandler is associated to a unique combination
    of integer-integerIndex-factorIndex`);
            const key = "" + integerIndex + integer + factorIndex;
            if ((nextFactorRequestHandlers[key] instanceof NextFactorRequestHandler)) {
                console.warn(`halting nextFactorRequestHandler key ${key}`);
                nextFactorRequestHandler = nextFactorRequestHandlers[key];
                nextFactorRequestHandler.halt();
            } else {
                weKnowThat(`If this happens it is a programming error.`);
                throw new Error(`NextFactorRequestHandler not found for key ${key}.`);
            }
        }
        catch (e) {
            console.error(`An unexpected error occured in the web worker upon trying to halt`);
            console.error("event", event);
            throw e;
        }
    }
});



