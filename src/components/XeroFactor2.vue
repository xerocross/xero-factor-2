<template>
    <div class="factor-widget">
        <div class="outer">
            <p class="intro">
                Enter an integer > 1 to find its prime factors.
            </p>
            <p>
                Computation happens <em>on your computer</em> so speed may vary. By 
                definition 1 is not prime, so it is not accepted as input.
            </p>
            <div
                v-if="isError"
                class="alert alert-danger"
                role="alert"
            >
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
                                >
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
                        <span
                            v-if="!isError && !invalidInput"
                            class="factors-list"
                        >
                            =
                            <span
                                v-for="i in factors"
                                :key="i.key"
                                class="factor-item"
                            >
                                ({{ i.string }})
                            </span>
                            <span ref="working">
                                <span
                                    v-if="isWorking"
                                    class="is-working-message"
                                >
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
<script src = "./XeroFactor2.ts"></script>
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
