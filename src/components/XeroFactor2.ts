import { defineComponent } from "vue";
import Debounce from "lodash.debounce";
import { Decimal } from "decimal.js";
import Factorizer from "../Factorizer";
import type { Observable, ObservableEvent } from "../Observable.d";
import { check, since, weKnowThat, letUs, weHave, soWe, so, weHaveThat } from "@xerocross/literate";
import { v4 as uuidv4 } from "uuid";
Decimal.set({ precision : 64 });

type IntegerInput = ((arg1 : string, arg2 : string) => void);

interface Factor {
    value : Decimal,
    string : string,
    key : number
}

interface XeroFactor2 {
    worker : Worker,
    factorizer : Factorizer
}


export default defineComponent({
    name : "XeroFactor2",
    props : {
        worker : {
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
            integerInput : "2",
            lastInteger : undefined,
            factors : [] as Factor[],
            observables : [],
            integer : new Decimal(2),
            isWorking : false,
            invalidInput : false,
            isError : false,
            clearFactorize : () => {},
            factorIndex : 0,
            workingString : "",
            history : [],
            currentActivity : "",
            factorizer : undefined as Factorizer | undefined,
            integerIndex : 0 as number
        };
    },
    watch : {
        integerInput : Debounce(function (newValue, oldValue) {
            this.pushHistory(`integerInput changed to: ${newValue} from ${oldValue}`);
            console.debug(`changed input: ${newValue}`);
            const isInputValid = this.checkValidInput(newValue);
            console.debug(`ran input validity check: ${isInputValid}`);
            if (isInputValid) {
                this.lastInteger = this.integer;
                this.integer = new Decimal(newValue);
                this.clear();
                this.factor()
                    .then((val) => {
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
                    .catch((val) => {
                        this.pushHistory(`work failed with ${val}`);
                        this.done();
                        for (const str of this.history) {
                            console.log(str);
                        }
                    });
            }
            this.invalidInput = !isInputValid;
            if (!isInputValid)
                console.log(`invalidInput: ${this.invalidInput}`);
        }, 100) as IntegerInput
    },
    mounted () {
        this.animateWaiting();
        if (this.worker !== null) {
            console.debug("found web worker");
            this.workerFound(true);
        } else {
            this.workerFound(false);
        }
        this.factorizer = new Factorizer(this.queryObject, this.worker);
        this.pushHistory(`component mounted`);
    },
    methods : {
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
            console.trace();
            console.warn("tracing clear factorize");
            if (this.clearFactorize) {
                console.warn("clear factorize found");
                this.clearFactorize();
                this.clearFactorize = undefined;
            }
            for (const obs of this.observables) {
                obs.cancel();
            }
            if (this.worker) {
                console.log(this.worker);
                // eslint-disable-next-line vue/no-mutating-props
                console.debug(`halting ${this.lastInteger}`);
                this.pushHistory(`attempting to halt worker on integer ${this.lastInteger}`);
                if (this.lastInteger) {
                    this.worker.postMessage({
                        "status" : "halt",
                        "payload" : {
                            "integer" : this.lastInteger.toString()
                        }
                    });
                }
            }
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
                input: ${this.integerInput};
                factorId : ${this.factorize.getId ? this.factorize.getId() : ""};
                factors: ${factorString};
                num observables: ${this.observables.length};
                factors: ${factorString};
                isWorking: ${this.isWorking};
                isError: ${this.isError};
                currentActivity: ${this.currentActivity};
                `;
        },
        pushFactor (factor : Decimal) {
            console.debug(`found factor: ${factor}`);
            if (!factor.isInteger()) {
                this.logState();
                this.isError = true;
                throw new Error(`attempted to push non-integer factor ${factor}`);
            }
            this.pushHistory(`pushing new factor ${factor} for integer ${this.integer}.`);
            this.factors.push({
                value : factor,
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
        checkProduct () {
            let product = new Decimal(1);
            for (const i of this.factors) {
                product = product.times(i.value);
            }
            return (product.equals(this.integer));
        },
        factor () {
            interface Subscriber {
                observable : Observable,
                clear ?: () => void
            }
            this.pushHistory(`Started factoring ${this.integer}.`);
            this.beginningWork();
            console.debug("factoring");
            this.$emit("BeginWorking");
            this.isWorking = true;
            
            const subscriber : Subscriber =
            letUs(`create a dummy subscriber object to be filled in 
            (that is, mutated) by the factorize function`, () => {
                return {
                    observable : {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        subscribe : (subFun) => {
                            console.error("the subscriber object was not properly mutated");
                        },
                        cancel : () => {}
                    } as Observable
                };
            });
            const waitFunction = (infun : ((...args : any[]) => void)) => {
                return new Promise((resolve) => {
                    this.$nextTick(() => {
                        window.requestAnimationFrame(() => {
                            resolve(infun());
                        });
                    });
                });
            };
            const factorPromise = this.factorizekkdnw(this.integerFactoringKey(), this.integer, this.worker, waitFunction, subscriber);
            
            console.warn("by now the clearFactorizer function should be defined:", subscriber.clear);
            this.clearFactorize = subscriber.clear;
            subscriber.observable.subscribe((event : ObservableEvent) => {
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
                        console.error(`an unexpected error occurred: ${event.payload.error.message}`);
                        console.trace();
                        console.error(event.payload.error);
                        this.workFinishedDefer.reject("observable sent an error");
                        throw event.payload.error;
                    case "success":
                        this.pushHistory(`factoring observable sent message: success`);
                        break;
                    default:
                        console.error("An unknown error occurred");
                        console.trace();
                        this.pushHistory(`observable sent an unexpected message`);
                        this.isError = true;
                        break;
                }   
            });
            this.observables.push(subscriber.observable);
            this.factorIndex++;
            return factorPromise;
        }
    }
});