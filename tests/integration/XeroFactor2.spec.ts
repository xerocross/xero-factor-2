import { defineComponent } from "vue";
import { shallowMount, mount, VueWrapper } from "@vue/test-utils";
import XeroFactor2 from "../../src/components/XeroFactor2";
import { MyWorker } from "../../src/components/Xerofactor2.d";


let xeroFactor2 : VueWrapper<ReturnType<typeof defineComponent>>;

class Worker {

}

function simulateUserWaiting (done : () => boolean, timeout : number) {
    return new Promise((resolve, reject) => {
        const intervalAsync = setInterval(() => {
            if (done()) {
                clearTimeout(intervalAsync);
                resolve(true);
            }
        }, 100);
        setTimeout(() => {
            console.log("TIMEOUT");
            clearTimeout(intervalAsync);
            reject(false);
        }, timeout);
    });
}

class WebWorker implements MyWorker {
    constructor (responseArray : string[], integer : number) {
        this.responseArray = responseArray;
        this.integer = integer;
        this.postIndex = 0;
        this.onmessage = () => {};
        this.postMessage = () => {
            const key = "" + integer + this.postIndex;
            this.onmessage({
                data : {
                    key : key,
                    result : responseArray[this.postIndex]
                }
            });
            this.postIndex++;
        };
    }
    private postIndex;
    private responseArray : string[];
    private integer : number;
    public onmessage : (arg ?: object) => void;
    public postMessage : (arg ?: object) => void;
}

function getPrimaryNumberInput (xeroFactor2 : VueWrapper<ReturnType<typeof defineComponent>>) {
    return xeroFactor2.find(".primary-number-input");
}

function getFactorListOuter (xeroFactor2 : VueWrapper<ReturnType<typeof defineComponent>>) {
    return xeroFactor2.find(".factors-list");
}

function getVisibleFactors (xeroFactor2 : VueWrapper<ReturnType<typeof defineComponent>>) {
    const outer = getFactorListOuter(xeroFactor2);
    return outer.findAll(".factor-item");
}
function getIsWorkingMessage (xeroFactor2 : VueWrapper<ReturnType<typeof defineComponent>>) {
    return xeroFactor2.find(".is-working-message");
}
beforeEach(() => {
});

afterEach(() => {
    jest.useRealTimers();
});

describe("mounting", () => {
    test("component will mount", () => {
        expect(() => {
            xeroFactor2 = shallowMount(XeroFactor2, {
                propsData : {
                    "worker" : undefined
                }
            });
        }).not.toThrow();
    });
    test("initial input value is '2'", async () => {
        xeroFactor2 = shallowMount(XeroFactor2);
        const numInput = getPrimaryNumberInput(xeroFactor2);
        await xeroFactor2.vm.$nextTick();
        expect((numInput.element as HTMLInputElement).value).toBe("2");
    });
    
    test("primary number input exists", async () => {
        xeroFactor2 = shallowMount(XeroFactor2, {
            propsData : {
                worker : undefined
            }
        });
        const numInput = getPrimaryNumberInput(xeroFactor2);
        await xeroFactor2.vm.$nextTick();
        expect(numInput.exists()).toBe(true);
    });
});


describe("input validity checks", () => {
    test("negative integer invalid", async () => {
        jest.useFakeTimers();
        xeroFactor2 = shallowMount(XeroFactor2, {
            propsData : {
                worker : undefined
            }
        });
        await xeroFactor2.vm.$nextTick();
        const numInput = getPrimaryNumberInput(xeroFactor2);
        numInput.setValue("-2");
        await xeroFactor2.vm.$nextTick();
        jest.advanceTimersByTime(400);
        await xeroFactor2.vm.$nextTick();
        expect(xeroFactor2.vm.invalidInput).toBe(true);
    });
    
    test("decimal input invalid", async () => {
        jest.useFakeTimers();
        xeroFactor2 = shallowMount(XeroFactor2, {
            propsData : {
                worker : undefined
            }
        });

        await xeroFactor2.vm.$nextTick();
        const numInput = getPrimaryNumberInput(xeroFactor2);
        await xeroFactor2.vm.$nextTick();
        numInput.setValue("2.3");
        await xeroFactor2.vm.$nextTick();
        jest.advanceTimersByTime(1000);
        await xeroFactor2.vm.$nextTick();
        expect(xeroFactor2.vm.invalidInput).toBe(true);
    });
    
    test("non-numeric input invalid", async () => {
        jest.useFakeTimers();
        xeroFactor2 = shallowMount(XeroFactor2, {
            propsData : {
                worker : undefined
            }
        });
        const numInput = getPrimaryNumberInput(xeroFactor2);
        numInput.setValue("2a");
        await xeroFactor2.vm.$nextTick();
        jest.advanceTimersByTime(1000);
        await xeroFactor2.vm.$nextTick();
        expect(xeroFactor2.vm.invalidInput).toBe(true);
    });
});

test("during working, shows '(working)' message",  async () => {
    xeroFactor2 = mount(XeroFactor2, {
        propsData : {
            worker : undefined
        }
    });
    let functionRan = false;
    let isWorkingExists = false;
    xeroFactor2.vm.pushFactor = () => {
        functionRan = true;
        xeroFactor2.vm.logState();
        isWorkingExists = getIsWorkingMessage(xeroFactor2).exists();
    };
    const numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("12");
    await simulateUserWaiting(() => functionRan, 500);
    expect(isWorkingExists).toBeTruthy();
});

describe("for web worker disabled", () => {
    test("input number 3 produces prime factors '(3)'", async () => {
        let doneFunctionRan = false;
        const workComplete = () => {
            doneFunctionRan = true;
        };
        xeroFactor2 = mount(XeroFactor2, {
            props : {
                done : workComplete,
                worker : undefined
            }
        });
        const numInput = getPrimaryNumberInput(xeroFactor2);
        
        numInput.setValue("3");
        await simulateUserWaiting(() => doneFunctionRan, 500);
        const visibleFactors = getVisibleFactors(xeroFactor2)!;
        expect(visibleFactors.at(0)!.text()).toBe("(3)");
        expect(visibleFactors.length).toBe(1);
    });
    test("input number 12 produces prime factors '(2)(2)(3)'", async () => {
        let doneFunctionRan = false;
        const workComplete = () => {
            
            doneFunctionRan = true;
        };
        xeroFactor2 = mount(XeroFactor2, {
            props : {
                done : workComplete,
                worker : undefined
            }
        });
        const numInput = getPrimaryNumberInput(xeroFactor2);
        numInput.setValue("12");
        await simulateUserWaiting(() => doneFunctionRan, 1000);
        const visibleFactors = getVisibleFactors(xeroFactor2);
        expect(visibleFactors.at(0)!.text()).toBe("(2)");
        expect(visibleFactors.at(1)!.text()).toBe("(2)");
        expect(visibleFactors.at(2)!.text()).toBe("(3)");
        expect(visibleFactors.length).toBe(3);
    });
    test("input number 5562 produces prime factors '(2)(3)(3)(3)(103)'", async () => {
        let doneFunctionRan = false;
        const workComplete = () => {
            
            doneFunctionRan = true;
        };
        xeroFactor2 = mount(XeroFactor2, {
            props : {
                done : workComplete,
                worker : undefined
            }
        });
        const numInput = getPrimaryNumberInput(xeroFactor2);
        numInput.setValue("5562");
        await simulateUserWaiting(() => doneFunctionRan, 1000);
        const visibleFactors = getVisibleFactors(xeroFactor2);
        expect(visibleFactors.at(0)!.text()).toBe("(2)");
        expect(visibleFactors.at(1)!.text()).toBe("(3)");
        expect(visibleFactors.at(2)!.text()).toBe("(3)");
        expect(visibleFactors.at(3)!.text()).toBe("(3)");
        expect(visibleFactors.at(4)!.text()).toBe("(103)");
        expect(visibleFactors.length).toBe(5);
    });
    test("input number 2923675 produces prime factors '(5) (5) (83) (1409)'", async () => {
        let doneFunctionRan = false;
        const workComplete = () => {
            
            doneFunctionRan = true;
        };
        xeroFactor2 = mount(XeroFactor2, {
            props : {
                done : workComplete,
                worker : undefined
            }
        });
        const numInput = getPrimaryNumberInput(xeroFactor2);
        numInput.setValue("2923675");
        await simulateUserWaiting(() => doneFunctionRan, 2000);
        const visibleFactors = getVisibleFactors(xeroFactor2);
        expect(visibleFactors.at(0)!.text()).toBe("(5)");
        expect(visibleFactors.at(1)!.text()).toBe("(5)");
        expect(visibleFactors.at(2)!.text()).toBe("(83)");
        expect(visibleFactors.at(3)!.text()).toBe("(1409)");
        expect(visibleFactors.length).toBe(4);
    });
    test("input number 29236752 produces prime factors '(2) (2) (2) (2) (3) (3) (191) (1063)'", async () => {
        let doneFunctionRan = false;
        const workComplete = () => {
            doneFunctionRan = true;
        };
        xeroFactor2 = mount(XeroFactor2, {
            props : {
                done : workComplete,
                worker : undefined
            }
        });
        const numInput = getPrimaryNumberInput(xeroFactor2);
        numInput.setValue("29236752");
        await simulateUserWaiting(() => doneFunctionRan, 2000);
        const visibleFactors = getVisibleFactors(xeroFactor2);
        expect(visibleFactors.at(0)!.text()).toBe("(2)");
        expect(visibleFactors.at(1)!.text()).toBe("(2)");
        expect(visibleFactors.at(2)!.text()).toBe("(2)");
        expect(visibleFactors.at(3)!.text()).toBe("(2)");
        expect(visibleFactors.at(4)!.text()).toBe("(3)");
        expect(visibleFactors.at(5)!.text()).toBe("(3)");
        expect(visibleFactors.at(6)!.text()).toBe("(191)");
        expect(visibleFactors.at(7)!.text()).toBe("(1063)");
        expect(visibleFactors.length).toBe(8);
    });
    test("mount without worker calls workerFound(false)", (done) => {
        xeroFactor2 = mount(XeroFactor2, {
            propsData : {
                workerFound : (val : boolean) => {
                    if (val) {
                        expect(false).toBeTruthy();
                        done();
                    } else {
                        done();
                    }
                },
                worker : undefined
            } 
        });
        // input is required to set the component in motion
        const numInput = getPrimaryNumberInput(xeroFactor2);
        numInput.setValue("12");
    });
});


describe("with mock worker", () => {
    test("mount with worker calls workerFound(true)", (done) => {
        class MyWebWorker implements MyWorker {
            public onmessage = () => {};
            public postMessage = () => {};
        }

        xeroFactor2 = mount(XeroFactor2, {
            propsData : {
                worker : new MyWebWorker(),
                workerFound : (val : boolean) => {
                    if (val) {
                        done();
                    } else {
                        expect(false).toBeTruthy();
                        done();
                    }
                }
            }
        });
        // input is required to set the component in motion
        const numInput = getPrimaryNumberInput(xeroFactor2);
        numInput.setValue("12");
    });
    test("factors 12 as (2)(2)(3)", (done) => {
        const myWorker = new WebWorker(["2", "2", "3"], 12);
        const myWorkDoneFunction = () => {
            const visibleFactors = getVisibleFactors(xeroFactor2);
            expect(visibleFactors.at(0)!.text()).toBe("(2)");
            expect(visibleFactors.at(1)!.text()).toBe("(2)");
            expect(visibleFactors.at(2)!.text()).toBe("(3)");
            expect(visibleFactors.length).toBe(3);
            done();
        };
    
        xeroFactor2 = mount(XeroFactor2, {
            propsData : {
                worker : myWorker,
                "done" : myWorkDoneFunction
            }
        });
        const numInput = getPrimaryNumberInput(xeroFactor2);
        xeroFactor2.vm.$nextTick(() => {
            numInput.setValue("12");
        });
    });
    test("factors 14 as (2)(7)", (done) => {
        const myWorker = new WebWorker(["2", "7"], 14);
        const myWorkDoneFunction = () => {
            const visibleFactors = getVisibleFactors(xeroFactor2);
            expect(visibleFactors.at(0)!.text()).toBe("(2)");
            expect(visibleFactors.at(1)!.text()).toBe("(7)");
            expect(visibleFactors.length).toBe(2);
            done();
        };
    
        xeroFactor2 = mount(XeroFactor2, {
            propsData : {
                worker : myWorker,
                "done" : myWorkDoneFunction
            }
        });
        xeroFactor2.vm.$nextTick(() => {
            const numInput = getPrimaryNumberInput(xeroFactor2);
            numInput.setValue("14");
        });
    });

});