'use strict';

exports.io = {
    namespace: {
        '/': {
            connectionMiddleware: ['generateId'],
        },
    }
};

exports.keys = '123';
