'use strict';

module.exports = app => {
  class User extends app.Service {
    * say() {
      return 'Helle Man!';
    }
  }
  return User;
};
