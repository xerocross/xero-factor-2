<template>
    <div class="factor-widget">
        <div class="outer">
            <p class="intro">Enter a positive integer to find its prime factors.</p>
            <p>Computation happens <em>on your computer</em> so speed may vary.</p>
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
                        <span class="factors-list" v-if="!isError">
                            =
                            <span v-for="i in factors" :key="i.key" class="factor-item">
                                ({{ i.string }})
                            </span>
                            <span ref="working">
                                <span v-if="isWorking" class="is-working-message">
                                    (WORKING)
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
import q, { done } from "q";
import { Decimal } from "decimal.js";
import factorize from "../factorizer.js";

Decimal.set({ precision : 64 });

export default {
    props : {
        worker : {
            //type : Worker,
            default : () => {
                return null;
            }
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
            integerInput : 1,
            factors : [],
            integer : 0,
            compositeNumbers : {},
            isWorking : false,
            keyIndex : 0,
            timeoutQueue : [],
            intervalQueue : [],
            factorDeferred : null,
            invalidInput : false,
            deferreds : {},
            isError : false,
            workerIndex : 0,
            deferredKeys : []
        };
    },
    watch : {
        integerInput : Debounce(function () {
            console.log(`changed input: ${this.integerInput}`);
            let check = this.checkValidInput(this.integerInput);
            if (check) {
                this.integer = new Decimal(this.integerInput);
                
                setTimeout(() => {
                    this.clear();
                    this.factor();
                },10);
            }
        }, 100)
    },
    mounted () {
        this.animateWaiting();
        if (this.worker !== null) {
            console.log("found web worker");
            this.workerFound(true);
        } else {
            this.workerFound(false);
        }
    },
    methods : {
        checkValidInput (input) {
            let test = input.length > 0 && input.search(/[^(0-9)]/) == -1;
            if (test) {
                this.invalidInput = false;
            } else {
                this.invalidInput = true;
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
        clear () {
            // console.log("clearing");
            // for (let i = 0; i < this.timeoutQueue.length; i++) {
            //     clearTimeout(this.timeoutQueue[i]);
            // }
            // this.timeoutQueue = [];
            // for (let key of this.deferredKeys) {
            //     this.deferreds[key].reject("halt");
            //     delete this.deferreds[key];
            // }
            // this.deferreds = [];
            this.factors = [];
            this.isError = false;
            // this.workerIndex = 0;
            // this.deferredKeys = [];
        },
        // getNextFactor (int) {
        //     let deferred = q.defer();
        //     this.factorDeferred = deferred;
        //     let key = "" + int.toString() + this.workerIndex;
        //     this.deferreds[key] = deferred;
        //     this.deferredKeys.push(key);
        //     if (this.worker !== null) {
        //         this.workerFound(true);
        //         let myWorker = this.worker;
        //         myWorker.onmessage = function (e) {
        //             if (e.data.key == key) {
        //                 console.log(`worker sent message: integer : ${e.data.result}; key : ${e.data.key}`);
        //                 deferred.resolve(new Decimal(e.data.result));
        //             }
        //         };
        //         myWorker.postMessage({
        //             "integer" : int.toString(),
        //             "key" : key
        //         });
                
        //         this.workerIndex++;
        //     } else {
        //         this.timeoutQueue.push(
        //             setTimeout(function () {
        //                 let squareRoot = int.squareRoot();
        //                 let i = new Decimal(2);
        //                 while (i.lessThan(squareRoot)) {
        //                     let test = int.modulo(i).equals(0);
        //                     if (test) {
        //                         deferred.resolve(i);
        //                         break;
        //                     }
        //                     i = i.add(1);
        //                 }
        //                 deferred.resolve(int);
        //             }, 0)
        //         );
        //     }
        //     return deferred.promise;
        // },
        logState () {
            let product = this.getProduct();
            let factorString = this.getFactorString();
            let unresolvedTimers = this.timeoutQueue.length;
            console.log(`input was ${this.integerInput}; factors: ${factorString}; product: ${product.toString()}; timeouts: ${unresolvedTimers}`);
        },
        getFactorString () {
            let factorString = "";
            for (let factor of this.factors) {
                factorString = `${factorString}(${factor.string})`;
            }
            return factorString;
        },
        // getProduct () {
        //     let product = new Decimal(1);
        //     for (let i of this.factors) {
        //         product = product.times(i.value);
        //     }
        //     return product;
        // },
        pushFactor (val) {
            console.log(`found factor: ${val}`);
            let floor = val.floor();
            if (!val.equals(floor)) {
                this.logState();
                this.isError = true;
                throw new Error(`attempted to push non-integer factor ${val}`)
            }
            let key = val + ":" + this.keyIndex;
            this.keyIndex++;
            this.factors.push({
                value : val,
                key : key,
                string : val.toString()
            });
        },
        factor () {
            this.beginningWork();
            this.$emit("BeginWorking");

            const getProduct = () => {
                let product = new Decimal(1);
                for (let i of this.factors) {
                    product = product.times(i.value);
                }
                return product;
            }


            const observer = factorize(this.integer);
            observer.subscribe((event) => {
                let product;
                const status = event.status;
                switch (status) {
                    case "factor":
                        this.factors.push(event.payload.factor);
                        break;
                    case "error":
                        this.isError = true;
                        console.log(`an unexpected error occurred: ${event.payload.error.message}`);
                        console.log(event.payload.error);
                        break;
                    case "success":
                        done();
                        this.$emit("WorkComplete");
                        product = getProduct();
                        let test = (this.integer.equals(product));
                        if (test) {
                            console.log("passed product test");
                        } else {
                            console.log(`failed product test, product = ${product}`);
                            this.isError = true;
                        }
                        break;
                    default:
                        console.log("An unknown error occurred");
                        this.isError = true;
                        break;
                }   



            })


            
            // // `this` refers to the vue component
            // let quotient = this.integer;
            // // quotient maintains the value of
            // // the result of dividing this.integer
            // // by all of the factors found up to
            // // the execution point
            // this.isWorking = true; // for display
            // let factor;
            // this.beginningWork() // a hook for 
            // this.$emit("BeginWorking");
            // let tick = () => {
            //     this.pushFactor(factor);
            //     if (factor.lessThan(quotient)) {
            //         quotient = quotient.div(factor);
            //         this
            //             .getNextFactor(quotient)
            //             .then((factorResponse) => {
            //                 factor = factorResponse;
            //                 this.timeoutQueue.push(
            //                     setTimeout(function () {
            //                         tick();
            //                     }, 0)
            //                 );
            //             })
            //             .fail((e) => {
            //                 console.log(`failed: ${e}`);
            //             });
            //     } else {
            //         let product = this.getProduct();
            //         let valid = product.equals(new Decimal(this.integerInput));
            //         if (!valid) {
            //             this.isError = true;
            //             throw new Error(`factorization error: input was ${this.integerInput}; factors: ${this.getFactorString()}; product: ${product}`);
            //         } else {
            //             console.log(`factorization test was successful`);
            //         }
            //         this.$nextTick(() => {
            //             this.done(this);
            //             this.$emit("WorkComplete");
            //             this.isWorking = false;
            //         });
            //     }
            // };
            // this.getNextFactor(quotient)
            //     .then((firstFactor) => {
            //         factor = firstFactor;
            //         this.timeoutQueue.push(
            //             setTimeout(function () {
            //                 tick();
            //             }, 0)
            //         );
            //     })
            //     .fail((e) => {
            //         console.log(`failed: ${e}`);
            //     });
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
