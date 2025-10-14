'use strict';

const { RexxInterpreter } = require('./interpreter');

class RexxInterpreterBuilder {
  constructor(addressSender) {
    this.addressSender = addressSender;
    this.options = {
      'dom-interop': true,
      'tracing': false,
      'numeric-digits': 9,
      'numeric-fuzz': 0,
      'numeric-form': 'SCIENTIFIC'
    };
    this.outputHandler = null;
  }

  withoutDomInterop() {
    this.options['dom-interop'] = false;
    return this;
  }

  withDomInterop(enabled = true) {
    this.options['dom-interop'] = enabled;
    return this;
  }

  withTracing(enabled = true) {
    this.options['tracing'] = enabled;
    return this;
  }

  withOutputHandler(handler) {
    this.outputHandler = handler;
    return this;
  }

  withNumericPrecision(digits) {
    this.options['numeric-digits'] = digits;
    return this;
  }

  withNumericFuzz(fuzz) {
    this.options['numeric-fuzz'] = fuzz;
    return this;
  }

  withNumericForm(form) {
    this.options['numeric-form'] = form;
    return this;
  }

  build() {
    return new RexxInterpreter(this.addressSender, this.options, this.outputHandler);
  }
}

module.exports = RexxInterpreterBuilder;
