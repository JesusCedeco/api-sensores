// middlewares/auth.js
import basicAuth from 'express-basic-auth';

const users = {
    'admin': 'jcm',
    'user1': '1234'
};

export const authMiddleware = basicAuth({
    authorizer: (username, password) => {
        return users[username] && users[username] === password;
    },
    challenge: true,
    unauthorizedResponse: 'Acceso denegado.'
});