'use strict';

module.exports = app => {
  class User extends app.Service {
    async say() {
      return 'Helle Man!';
    }
  }
  return User;
};
