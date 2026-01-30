import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../shared/database/client.js';
import { config } from './index.js';

// GitHub OAuth Strategy
if (config.oauth.github.clientId && config.oauth.github.clientSecret) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: config.oauth.github.clientId,
        clientSecret: config.oauth.github.clientSecret,
        callbackURL: config.oauth.github.callbackURL || `${config.frontendUrl}/api/auth/github/callback`,
        scope: ['user:email'],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (error: any, user?: any) => void
      ) => {
        try {
          const githubId = profile.id;
          const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
          const username = profile.username;
          const displayName = profile.displayName || profile.username;
          const avatar = profile.photos?.[0]?.value;

          // Check if user exists with this GitHub ID
          let user = await prisma.user.findUnique({
            where: { githubId },
          });

          if (user) {
            // User exists, update last active
            user = await prisma.user.update({
              where: { id: user.id },
              data: { lastActive: new Date() },
            });
            return done(null, user);
          }

          // Check if user exists with same email
          const existingEmailUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingEmailUser) {
            // Link GitHub account to existing user
            user = await prisma.user.update({
              where: { id: existingEmailUser.id },
              data: {
                githubId,
                githubUrl: profile.profileUrl || `https://github.com/${username}`,
                lastActive: new Date(),
              },
            });
            return done(null, user);
          }

          // Generate unique username if taken
          let finalUsername = username;
          let counter = 1;
          while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
            finalUsername = `${username}${counter}`;
            counter++;
          }

          // Create new user
          user = await prisma.user.create({
            data: {
              email,
              username: finalUsername,
              displayName,
              avatar,
              githubId,
              githubUrl: profile.profileUrl || `https://github.com/${username}`,
            },
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

// Google OAuth Strategy
if (config.oauth.google.clientId && config.oauth.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.oauth.google.clientId,
        clientSecret: config.oauth.google.clientSecret,
        callbackURL: config.oauth.google.callbackURL || `${config.frontendUrl}/api/auth/google/callback`,
        scope: ['profile', 'email'],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (error: any, user?: any) => void
      ) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;
          const displayName = profile.displayName;
          const avatar = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error('No email provided by Google'));
          }

          // Check if user exists with this Google ID
          let user = await prisma.user.findUnique({
            where: { googleId },
          });

          if (user) {
            // User exists, update last active
            user = await prisma.user.update({
              where: { id: user.id },
              data: { lastActive: new Date() },
            });
            return done(null, user);
          }

          // Check if user exists with same email
          const existingEmailUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingEmailUser) {
            // Link Google account to existing user
            user = await prisma.user.update({
              where: { id: existingEmailUser.id },
              data: {
                googleId,
                lastActive: new Date(),
              },
            });
            return done(null, user);
          }

          // Generate username from email
          let username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
          let counter = 1;
          while (await prisma.user.findUnique({ where: { username } })) {
            username = `${email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')}${counter}`;
            counter++;
          }

          // Create new user
          user = await prisma.user.create({
            data: {
              email,
              username,
              displayName,
              avatar,
              googleId,
            },
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
