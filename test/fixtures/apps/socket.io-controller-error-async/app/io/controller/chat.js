'use strict';

module.exports = () => {
  return async () => {
    throw new Error('Controller Error!');
  };
};
