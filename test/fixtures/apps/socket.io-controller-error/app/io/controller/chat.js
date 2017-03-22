'use strict';

module.exports = () => {
  return function* () {
    throw new Error('Controller Error!');
  };
};
