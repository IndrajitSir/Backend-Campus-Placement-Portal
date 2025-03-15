import {Router} from 'express';
import { register, login } from '../controllers/auth.controller.js';
import passport from '../config/passport.js';
const router = Router();

router.route("/register").post(register);
router.route("/login").post(login);

// **Google Auth Routes**
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { successRedirect: process.env.FRONTEND_URL, failureRedirect: '/' }));

// **GitHub Auth Routes**
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { successRedirect: process.env.FRONTEND_URL, failureRedirect: '/' }));

// **LinkedIn Auth Routes**
router.get('/linkedin', passport.authenticate('linkedin'));
router.get('/linkedin/callback', passport.authenticate('linkedin', { successRedirect: process.env.FRONTEND_URL, failureRedirect: '/' }));
export default router