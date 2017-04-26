'use strict'

module.exports = app => {
  return function* (next) {
    this.socket.on('anEventNotRegisterInTheRouter',()=> {
    
    })
    yield* next
  }
}