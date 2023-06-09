import { shallowMount, mount } from '@vue/test-utils';
import XeroFactor2 from "./XeroFactor2.vue";

let Worker = null;
let xeroFactor2;
function getPrimaryNumberInput (xeroFactor2) {
    return xeroFactor2.find(".primary-number-input");
}

function getFactorListOuter (xeroFactor2) {
    return xeroFactor2.find(".factors-list")
}

function getVisibleFactors (xeroFactor2) {
    let outer = getFactorListOuter(xeroFactor2);
    return outer.findAll(".factor-item");
}
function getIsWorkingMessage (xeroFactor2) {
    return xeroFactor2.find(".is-working-message");
}
beforeEach(() => {
    localStorage.clear();
    
    Worker = () => {
        throw new Error("worker not defined");
    }
})

afterEach(() => {
    // Clean up the mounted component after each test
    xeroFactor2.vm.clear();
    xeroFactor2.unmount();
});

test("component will mount", () => {
    expect(() => {
        xeroFactor2 = shallowMount(XeroFactor2, {
            propsData : {
                "worker" : null
            }
        });
    }).not.toThrow();
});

test("primary number input exists", () => {
    xeroFactor2 = shallowMount(XeroFactor2);
    let numInput = getPrimaryNumberInput(xeroFactor2);
    expect(numInput.exists()).toBe(true);
});

test("negative integer invalid", () => {
    Worker = null;
    xeroFactor2 = shallowMount(XeroFactor2);
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("-2");
    expect(xeroFactor2.vm.invalidInput).toBe(false);
});

test("decimal input invalid", () => {
    Worker = null;
    xeroFactor2 = shallowMount(XeroFactor2);
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("2.3");
    expect(xeroFactor2.vm.invalidInput).toBe(false);
});

test("non-numeric input invalid", () => {
    Worker = null;
    xeroFactor2 = shallowMount(XeroFactor2);
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("2a");
    expect(xeroFactor2.vm.invalidInput).toBe(false);
});

test("initial input value is '2'", () => {
    xeroFactor2 = shallowMount(XeroFactor2);
    let numInput = getPrimaryNumberInput(xeroFactor2);
    expect(numInput.element.value).toBe("2");
});


test("during working, shows '(working)' message", (done) => {
    window.Worker = null;
    xeroFactor2 = mount(XeroFactor2, {});
    xeroFactor2.vm.pushFactor = function () {
        expect(getIsWorkingMessage(xeroFactor2).exists()).toBe(true);
        xeroFactor2.vm.clear();
        done();
    }
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("12");
});

test("input number 3 produces prime factors '(3)', worker disabled", (done) => {
    window.Worker = null;
    let workComplete = () => {
        let visibleFactors = getVisibleFactors(xeroFactor2);
        expect(visibleFactors.at(0).text()).toBe("(3)");
        expect(visibleFactors.length).toBe(1);
        done();
    }
    xeroFactor2 = mount(XeroFactor2, {
        props : {
            done : workComplete
        }
    });
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("3");
});

test("input number 12 produces prime factors '(2)(2)(3)', worker disabled", (done) => {
    window.Worker = null;
    let workComplete = () => {
        let visibleFactors = getVisibleFactors(xeroFactor2);
        expect(visibleFactors.at(0).text()).toBe("(2)");
        expect(visibleFactors.at(1).text()).toBe("(2)");
        expect(visibleFactors.at(2).text()).toBe("(3)");
        expect(visibleFactors.length).toBe(3);
        done();
    }
    xeroFactor2 = mount(XeroFactor2,{
        props : {
            done : workComplete
        }
    });
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("12");
});

test("input number 5562 produces prime factors '(2)(3)(3)(3)(103)', worker disabled", (done) => {
    window.Worker = null;
    let workComplete = () => {
        let visibleFactors = getVisibleFactors(xeroFactor2);
        expect(visibleFactors.at(0).text()).toBe("(2)");
        expect(visibleFactors.at(1).text()).toBe("(3)");
        expect(visibleFactors.at(2).text()).toBe("(3)");
        expect(visibleFactors.at(3).text()).toBe("(3)");
        expect(visibleFactors.at(4).text()).toBe("(103)");
        expect(visibleFactors.length).toBe(5);
        done();
    }
    xeroFactor2 = mount(XeroFactor2,{
        props : {
            done : workComplete
        }
    });
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("5562");
});

test("input number 2923675 produces prime factors '(5) (5) (83) (1409)', worker disabled", (done) => {
    window.Worker = null;
    let workComplete = () => {
        let visibleFactors = getVisibleFactors(xeroFactor2);
        expect(visibleFactors.at(0).text()).toBe("(5)");
        expect(visibleFactors.at(1).text()).toBe("(5)");
        expect(visibleFactors.at(2).text()).toBe("(83)");
        expect(visibleFactors.at(3).text()).toBe("(1409)");
        expect(visibleFactors.length).toBe(4);
        done();
    }
    xeroFactor2 = mount(XeroFactor2,{
        props : {
            done : workComplete
        }
    });
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("2923675");
});

test("input number 29236752 produces prime factors '(2) (2) (2) (2) (3) (3) (191) (1063)', worker disabled", (done) => {
    window.Worker = null;
    let workComplete = () => {
        let visibleFactors = getVisibleFactors(xeroFactor2);
        expect(visibleFactors.at(0).text()).toBe("(2)");
        expect(visibleFactors.at(1).text()).toBe("(2)");
        expect(visibleFactors.at(2).text()).toBe("(2)");
        expect(visibleFactors.at(3).text()).toBe("(2)");
        expect(visibleFactors.at(4).text()).toBe("(3)");
        expect(visibleFactors.at(5).text()).toBe("(3)");
        expect(visibleFactors.at(6).text()).toBe("(191)");
        expect(visibleFactors.at(7).text()).toBe("(1063)");
        expect(visibleFactors.length).toBe(8);
        done();
    }
    xeroFactor2 = mount(XeroFactor2,{
        props : {
            done : workComplete
        }
    });
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("29236752");
});

test("input number 35567588767879 produces prime factors '(7) (5081084109697)', worker disabled", (done) => {
    window.Worker = null;
    let workComplete = () => {
        let visibleFactors = getVisibleFactors(xeroFactor2);
        expect(visibleFactors.at(0).text()).toBe("(7)");
        expect(visibleFactors.at(1).text()).toBe("(5081084109697)");
        expect(visibleFactors.length).toBe(2);
        done();
    }
    xeroFactor2 = mount(XeroFactor2,{
        props : {
            done : workComplete
        }
    });
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("35567588767879");
}, 10000);

test("input number 287789543 produces prime factors '(287789543)', worker disabled", (done) => {
    jest.setTimeout(10000);
    window.Worker = null;
    let workComplete = () => {
        let visibleFactors = getVisibleFactors(xeroFactor2);
        expect(visibleFactors.at(0).text()).toBe("(287789543)");
        expect(visibleFactors.length).toBe(1);
        done();
    }
    xeroFactor2 = mount(XeroFactor2,{
        props : {
            done : workComplete
        }
    });
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("287789543");
});

test("mount with worker calls workerFound(true)", (done) => {
    Worker = function () {
        this.onmessage = () => {};
        this.postMessage = () => {
        }
    }
    xeroFactor2 = mount(XeroFactor2, {
        propsData : {
            worker : new Worker(),
            workerFound : (val) => {
                if (val) {
                    done();
                } else {
                    expect(false);
                    done();
                }
            }
        }
    });
    // input is required to set the component in motion
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("12");
});

test("mount without worker calls workerFound(false)", (done) => {
    xeroFactor2 = mount(XeroFactor2, {
        propsData : {
            workerFound : (val) => {
                if (val) {
                    expect(false);
                    done();
                } else {
                    done();
                }
            }
        }
    });
    // input is required to set the component in motion
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("12");
});

test("response from worker gets added to view (12)", (done) => {
    let index = 0;

    Worker = function () {
        this.onmessage = () => {};
        this.postMessage = () => {
            switch (index) {
            case 0:
                this.onmessage({data : "2"});
                break;
            case 1:
                this.onmessage({data : "2"});
                break;
            case 2:
                this.onmessage({data : "3"});
                break;
            default:
                expect(false);
                done();
            }
            index++;
        }
    }
    let myWorker = new Worker();
    xeroFactor2 = mount(XeroFactor2, {
        propsData : {
            worker : myWorker,
            "done" : () => {
                let visibleFactors = getVisibleFactors(xeroFactor2);
                expect(visibleFactors.at(0).text()).toBe("(2)");
                expect(visibleFactors.at(1).text()).toBe("(2)");
                expect(visibleFactors.at(2).text()).toBe("(3)");
                expect(visibleFactors.length).toBe(3);
                done();
            }
        }
    });
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("12");
});

test("response from worker gets added to view (14)", (done) => {
    let index = 0;
    Worker = function () {
        this.onmessage = () => {};
        this.postMessage = () => {
            switch (index) {
            case 0:
                this.onmessage({data : "2"});
                break;
            case 1:
                this.onmessage({data : "7"});
                break;
            }
            index++;
        }
    }
    let myWorker = new Worker();
    xeroFactor2
    xeroFactor2 = mount(XeroFactor2, {
        propsData : {
            worker : myWorker,
            done : () => {
                let visibleFactors = getVisibleFactors(xeroFactor2);
                expect(visibleFactors.at(0).text()).toBe("(2)");
                expect(visibleFactors.at(1).text()).toBe("(7)");
                expect(visibleFactors.length).toBe(2);
                done();
            }
        }
    });
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("14");
});