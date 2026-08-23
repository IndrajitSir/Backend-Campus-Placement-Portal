import { Router } from 'express';
import { register, login, socialLoginSuccess } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { registerValidation, loginValidation } from '../validations/auth.validation.js';
import passport from '../config/passport.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
const router = Router();

router.route("/register").post(authLimiter, registerValidation, validate, register);
router.route("/login").post(authLimiter, loginValidation, validate, login);

// **Google Auth Routes**
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), socialLoginSuccess);

// **GitHub Auth Routes**
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), socialLoginSuccess);

export default router
