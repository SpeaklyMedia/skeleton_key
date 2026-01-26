import sessionHandler from './auth/session.js';

export default async (req, res) => sessionHandler(req, res);
