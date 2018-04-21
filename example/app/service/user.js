'use strict';

module.exports = app => {
  class User extends app.Service {
    async say() {
      return 'Hello Man!';
    }
  }
  return User;
};
