import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { User } from '../models/user.models.js';
import { Student } from '../models/student.model.js';

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// **Google Strategy**
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/v1/auth/google/callback`,
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
                user.googleId = profile.id;
                await user.save();
            } else {
                user = await User.create({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    role: "student"
                });
                await Student.create({ student_id: user._id });
            }
        }
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

// **GitHub Strategy**
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/v1/auth/github/callback`,
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ githubId: profile.id });
        if (!user) {
            const email = profile.emails ? profile.emails[0].value : `${profile.username}@github.com`;
            user = await User.findOne({ email });
            if (user) {
                user.githubId = profile.id;
                await user.save();
            } else {
                user = await User.create({
                    name: profile.displayName || profile.username,
                    email: email,
                    githubId: profile.id,
                    role: "student"
                });
                await Student.create({ student_id: user._id });
            }
        }
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

export default passport;
