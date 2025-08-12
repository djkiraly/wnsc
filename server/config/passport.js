const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./database');

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT * FROM users WHERE google_id = $1',
      [profile.id]
    );

    if (existingUser.rows.length > 0) {
      // User exists, update their information
      const user = existingUser.rows[0];
      const updatedUser = await db.query(`
        UPDATE users 
        SET first_name = $1, last_name = $2, email = $3, profile_picture = $4, updated_at = CURRENT_TIMESTAMP
        WHERE google_id = $5
        RETURNING *
      `, [
        profile.name.givenName,
        profile.name.familyName,
        profile.emails[0].value,
        profile.photos[0]?.value,
        profile.id
      ]);
      
      return done(null, updatedUser.rows[0]);
    } else {
      // Create new user
      const newUser = await db.query(`
        INSERT INTO users (google_id, email, first_name, last_name, profile_picture, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        profile.id,
        profile.emails[0].value,
        profile.name.givenName,
        profile.name.familyName,
        profile.photos[0]?.value,
        'member', // default role
        'active'
      ]);

      return done(null, newUser.rows[0]);
    }
  } catch (error) {
    console.error('Error in Google Strategy:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      done(null, result.rows[0]);
    } else {
      done(null, null);
    }
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, null);
  }
});

module.exports = passport;