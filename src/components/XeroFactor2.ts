import { defineComponent } from "vue";
import Debounce from "lodash.debounce";
import { Decimal } from "decimal.js";
import Factorizer from "../Factorizer";
import Observable from "../Observable";
import type { Subscriber } from "../Observable.d";
import { letUs } from "@xerocross/literate";
import WeAssert from "we-assert";
import type { WaitFunction } from "../WaitFunction.d";
import type { FactorRequest, FactoringEvent } from "../Factorizer.d";

Decimal.set({ precision : 64 });
const { D } 
= letUs("define Decimal alias", () => {
    const D = (x : string | number) => {
        return new Decimal(x);
    };
    return  { D };
});
type IntegerInput = ((arg1 : string, arg2 : string) => void);

interface Factor {
    value : Decimal,
    string : string,
    key : number
}

const we = WeAssert.build();

export default defineComponent({
    name : "XeroFactor2",
    props : {
        worker : {
            type : Object as () => Worker | null,
            default : null
        },
        queryObject : {
            default : null
        },
        done : {
            type : Function,
            default : () => {}
        },
        beginningWork : {
            type : Function,
            default : () => {}
        },
        workerFound : {
            type : Function,
            default : () => {
                return false;
            }
        }
    },
    data () {
        return {
            integerInput : "2" as string,
            lastInteger : undefined as Decimal | undefined,
            factors : [] as Factor[],
            //observables : [],
            integer : new Decimal(2) as Decimal,
            isWorking : false as boolean,
            invalidInput : false as boolean,
            isError : false as boolean,
            factorIndex : 0 as number,
            workingString : "",
            history : [] as string[],
            currentActivity : "",
            factorizer : undefined as Factorizer | undefined,
            integerIndex : 0 as number
        };
    },
    watch : {
        integerInput : Debounce(function (newValue : string, oldValue : string) {
            this.pushHistory(`integerInput changed to: ${newValue} from ${oldValue}`);
            console.debug(`changed input: ${newValue}`);
            this.handleChangedInput(newValue);
        }, 100) as IntegerInput
    },
    created () {
        if (this.queryObject && this.queryObject.assertionLevel) {
            we.setLevel(this.queryObject.assertionLevel);
        }
    },
    mounted () {
        letUs(`check if a Worker was found`, () => {
            if (this.worker instanceof Worker) {
                console.debug("found web worker");
                this.workerFound(true);
            } else {
                this.workerFound(false);
            }
        });
        this.animateWaiting();
        letUs(`create the Factorizer object, which is a singleton for the app`, () => {
            this.factorizer = new Factorizer(this.queryObject, this.worker);
            this.pushHistory(`factorizer created`);
            
            const waitFunction : WaitFunction = (infun : ((...args : any[]) => void)) => {
                return new Promise((resolve) => {
                    this.$nextTick(() => {
                        window.requestAnimationFrame(() => {
                            resolve(infun());
                        });
                    });
                });
            };
            this.factorizer.setWaitFunction(waitFunction);
            this.pushHistory(`defined the wait function for the factorizer`);
        });
        this.pushHistory(`component mounted`);
    },
    methods : {
        handleChangedInput (newValue : string) {
            const isInputValid = this.checkValidInput(newValue);
            console.debug(`ran input validity check: ${isInputValid}`);
            if (isInputValid) {
                this.lastInteger = this.integer;
                this.integer = new Decimal(newValue);
                this.clear();
                this.factor()
                    .then((val : string) => {
                        this.isWorking = false;
                        this.done();
                        console.debug("just called done function");
                        this.$emit("WorkComplete");
                        this.pushHistory(`work completed with ${val}`);
                        for (const str of this.history) {
                            console.log(str);
                        }
                        if (this.checkProduct()) {
                            console.debug("passed product test");
                        } else {
                            console.error(`failed product test`);
                            this.isError = true;
                        }
                    })
                    .catch((val : Error | string) => {
                        this.pushHistory(`work failed`);
                        this.done();
                        for (const str of this.history) {
                            console.log(str);
                        }
                        throw val;
                    });
            }
            this.invalidInput = !isInputValid;
            if (!isInputValid) {
                console.log(`invalidInput: ${this.invalidInput}`);
            }
        },
        checkValidInput (input : string) {
            this.pushHistory(`checking validity of input: ${input}`);
            let isInputValid : boolean;
            if (input.length == 0) {
                isInputValid = false;
            }
            const pattern = new RegExp(/^[1-9]\d*$/);
            const match = pattern.exec(input);
            let parsedDec : Decimal;
            let isGreaterThan1 = false;
            try {
                parsedDec = new Decimal(input);
                isGreaterThan1 = parsedDec.greaterThan(new Decimal(1));
            } catch (e) {
                console.error("input could not be parsed as a decimal");
            }
            if (match !== null && match[0] == input && isGreaterThan1) {
                isInputValid = true;
            } else {
                isInputValid = false;
            }
            return isInputValid;
        },
        animateWaiting () {
            const div = this.$refs.working;
            setInterval(function () {
                div.style.color = "green";
                setTimeout(function () {
                    div.style.color = "blue";
                }, 500);
            }, 1000);
        },
        halt () {
            console.trace("tracing clear factorize");
            console.trace();
            this.factorizer.halt();
        },
        clear () {
            this.factors = [];
            this.isError = false;
            this.halt();
            console.debug("cleared");
            this.pushHistory(`work cleared`);
        },
        logState () {
            console.debug(
                this.getStateString()
            );
        },
        getStateString () {
            const getFactorString = () => {
                let factorString = "";
                for (const factor of this.factors) {
                    factorString = `${factorString}(${factor.string})`;
                }
                return factorString;
            };
            const factorString = getFactorString();
            return `XeroFactor2 State:
                integerInput: ${this.integerInput};
                factorId : ${this.factorizer ? this.factorizer.getId() : ""};
                factors: ${factorString};
                isWorking: ${this.isWorking};
                isError: ${this.isError};
                currentActivity: ${this.currentActivity};
                `;
        },
        pushFactor (factor : string) {
            let factorDecimal;
            try {
                console.debug(`found factor: ${factor}`);
                factorDecimal = D(factor);
            } catch (e) {
                console.error("encountered an error trying to parse factor string");
            }
            if (!we.assert.atLevel("ERROR").that("factor is an integer", factorDecimal.isInteger())) {
                this.logState();
                this.isError = true;
            }
            this.pushHistory(`pushing new factor ${factor} for integer ${this.integer}.`);
            // key in the object below helps with displaying the factor
            // elements in the template
            this.factors.push({
                value : factorDecimal,
                string : factor.toString(),
                key : this.factorIndex
            });
            this.factorIndex++;
        },
        pushHistory (currentActivity : string) {
            this.currentActivity = currentActivity;
            this.history.push(this.getStateString());
        },
        showWorkingImage () {
            switch(this.workingString) {
                case "":
                    this.workingString = "|";
                    break;
                case "|":
                    this.workingString = "/";
                    break;
                case "/":
                    this.workingString = "-";
                    break;
                case "-":
                    this.workingString = "\\";
                    break;
                case "\\":
                    this.workingString = "|";
                    break;
                default:
                    this.workingString = "-";
                    break;
            }
        },
        checkProduct () : boolean {
            let product = D(1);
            for (const i of this.factors) {
                product = product.times(i.value);
            }
            return (product.equals(this.integer));
        },
        factor () : Promise<string> {
            this.pushHistory(`Started factoring ${this.integer}.`);
            this.beginningWork();
            console.debug("factoring");
            this.$emit("BeginWorking");
            this.isWorking = true;
            
            const subscriber : Subscriber =
            letUs(`create a dummy subscriber object to be filled in 
            (that is, mutated) by the factorize function`, () => {
                return {
                    observable : new Observable(() => {})
                };
            });
            
            const factorPromise = this.factorizer.factor({
                integer : this.integer,
                subscriber
            } as FactorRequest);

            subscriber.observable.subscribe((event : FactoringEvent) => {
                const status = event.status;
                switch (status) {
                    case "working":
                        this.showWorkingImage();
                        break;
                    case "factor":
                        this.pushHistory(`observable sent message factor: ${event.payload.factor}`);
                        this.pushFactor(event.payload.factor);
                        break;
                    case "error":
                        this.isError = true;
                        this.pushHistory(`finding next factor encountered an error`);
                        console.error(`an unexpected error occurred`, event.payload.error);
                        this.workFinishedDefer.reject("observable sent an error");
                        throw event.payload.error;
                    case "success":
                        this.pushHistory(`factoring observable sent message: success`);
                        break;
                    default:
                        console.error("An unexpected factoring event occurred");
                        this.pushHistory(`observable sent an unexpected message`);
                        this.isError = true;
                        break;
                }   
            });
            //this.observables.push(subscriber.observable);
            // recall that keeping track of factorIndex at this
            // level helps with displaying factors on the template
            this.factorIndex++;
            return factorPromise;
        }
    }
});