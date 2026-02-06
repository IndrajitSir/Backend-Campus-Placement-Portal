import { Router } from 'express';
import { register, login, socialLoginSuccess } from '../controllers/auth.controller.js';
import passport from '../config/passport.js';
const router = Router();

router.route("/register").post(register);
router.route("/login").post(login);

// **Google Auth Routes**
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), socialLoginSuccess);

// **GitHub Auth Routes**
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), socialLoginSuccess);

export default router