<template>
    <div class="factor-widget">
        <div class="outer">
            <p class="intro">Enter an integer > 1 to find its prime factors.</p>
            <p>Computation happens <em>on your computer</em> so speed may vary. By 
                definition 1 is not prime, so it is not accepted as input.</p>
            <div class = "alert alert-danger" role="alert" v-if="isError">
                An error has occurred.
            </div>
            <div class="row">
                <div class="col-sm-4 col">
                    <div class="col-inner">
                        <div class="input-form">
                            <form @submit.prevent="">
                                <input
                                    v-model="integerInput"
                                    name="primary-number-input"
                                    class="primary-number-input"
                                    :class="invalidInput ? 'red-border' : ''"
                                    type="text"
                                />
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-sm-8 col">
                    <div class="col-inner">
                        <span v-if="isError">
                            An error occurred during computation. You can 
                            usually correct this by removing your input value
                            completely and then pasting it back in.
                        </span>
                        <span v-if="invalidInput">
                            (invalid input)
                        </span>
                        <span class="factors-list" v-if="!isError && !invalidInput">
                            =
                            <span v-for="i in factors" :key="i.key" class="factor-item">
                                ({{ i.string }})
                            </span>
                            <span ref="working">
                                <span v-if="isWorking" class="is-working-message">
                                    (WORKING){{ workingString }}
                                </span>
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import Debounce from "lodash.debounce";
import { Decimal } from "decimal.js";
import Factorizer from "../Factorizer.js";

Decimal.set({ precision : 64 });

export default {
    props : {
        worker : {
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
            factors : [],
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
            factorize : () => {}
        };
    },
    watch : {
        integerInput : Debounce(function (newValue, oldValue) {
            this.pushHistory(`integerInput changed to: ${newValue} from ${oldValue}`);
            console.debug(`changed input: ${newValue}`);
            let check = this.checkValidInput(newValue);
            console.debug(`ran input validity check: ${check}`);
            if (check) {
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
                        for (let str of this.history) {
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
                        for (let str of this.history) {
                            console.log(str);
                        }
                    });
            }
            this.invalidInput = !check;
            if (!check)
                console.log(`invalidInput: ${this.invalidInput}`);
        }, 100)
    },
    mounted () {
        this.animateWaiting();
        if (this.worker !== null) {
            console.debug("found web worker");
            this.workerFound(true);
        } else {
            this.workerFound(false);
        }
        this.pushHistory(`component mounted`);
    },
    methods : {
        checkValidInput (input) {
            this.pushHistory(`checking validity of input: ${input}`);
            let test;
            if (input.length == 0) {
                test = false;
            }
            let pattern = new RegExp(/^\d+$/);
            let match = pattern.exec(input);
            if (match !== null && match[0] === input) {
                test = true;
            } else {
                test = false;
            }
            return test;
        },
        animateWaiting () {
            let div = this.$refs.working;
            window.x = this;
            setInterval(function () {
                div.style.color = "green";
                setTimeout(function () {
                    div.style.color = "blue";
                }, 500);
            }, 1000);
        },
        halt () {
            console.trace();
            if (this.clearFactorize) {
                this.clearFactorize();
                this.clearFactorize = undefined;
            }
            for (let obs of this.observables) {
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
                for (let factor of this.factors) {
                    factorString = `${factorString}(${factor.string})`;
                }
                return factorString;
            };
            let factorString = getFactorString();
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
        pushFactor (val) {
            console.debug(`found factor: ${val}`);
            let floor = val.floor();
            if (!val.equals(floor)) {
                this.logState();
                this.isError = true;
                throw new Error(`attempted to push non-integer factor ${val}`);
            }
            this.pushHistory(`pushing new factor ${val} for integer ${this.integer}.`);
            this.factors.push({
                value : val,
                string : val.toString(),
                key : this.factorIndex
            });
            this.factorIndex++;
        },
        pushHistory (currentActivity) {
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
            for (let i of this.factors) {
                product = product.times(i.value);
            }
            return (product.equals(this.integer));
        },
        factor () {
            this.factorize = new Factorizer().factor;
            this.pushHistory(`Started factoring ${this.integer}.`);
            this.beginningWork();
            console.debug("factoring");
            this.$emit("BeginWorking");
            this.isWorking = true;
            const subscriber = {};
            let waitFunction = (infun) => {
                this.$nextTick(() => {
                    window.requestAnimationFrame(() => {
                        infun();
                    });
                });
            };
            const factorPromise = this.factorize(this.integer, this.worker, waitFunction, subscriber);
            this.clearFactorize = subscriber.clear;

            subscriber.observable.subscribe((event) => {
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
            return factorPromise;
        }
    }
};
</script>
<style lang="scss">
.factor-widget {
  display: flex;
  align-items: center;
  justify-content: center;

  .outer {
    width: 100%;
  }

  .input-form {
    text-align: center;
    width: 100%;

    input {
      width: 100%;
    }
  }

  .intro {
    font-size: 18pt;
  }

  .col-inner {
    height: 5em;
    display: flex;
    align-items: center;
  }

  .invalid {
    position: relative;
    bottom: 0px;
    right: 0px;
    font-size: 22pt;
    background-color: yellow;
  }

  .red-border {
    border-style: solid;
    border-color: red;
    box-shadow: 0 0 10px red;
    outline: none;
  }
}
</style>
