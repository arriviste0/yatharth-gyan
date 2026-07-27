const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User    = require('../models/User');
const requireAuth = require('../middleware/auth');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
}

/* POST /api/auth/register */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/auth/login */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/auth/google */
router.post('/google', async (req, res) => {
  try {
    const { credential, access_token } = req.body;
    if (!credential && !access_token) return res.status(400).json({ error: 'credential or access_token required' });

    let googleId, email, name, picture;

    if (access_token) {
      // Fetch user profile from Google userinfo API
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user profile with access token');
      }
      const data = await response.json();
      googleId = data.sub;
      email = data.email;
      name = data.name;
      picture = data.picture;
    } else {
      // Verify ID token
      const clientIds = [
        process.env.GOOGLE_CLIENT_ID,
        process.env.VITE_GOOGLE_CLIENT_ID,
        '259886949867-a3v5f3t4cklfv34j28plug0m6p2nsmhl.apps.googleusercontent.com',
        '259886949867-7n73hh971etfnkvorj0km3296sjv879f.apps.googleusercontent.com',
        '615878644272-t70b00ha1ile2edhoamk4306bqhf8t7h.apps.googleusercontent.com'
      ].filter(Boolean);

      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: clientIds.length > 0 ? clientIds : undefined,
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    }

    if (!googleId || !email) {
      return res.status(400).json({ error: 'Google account details missing' });
    }

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        user.googleId = googleId;
        if (!user.avatarPhoto && picture) user.avatarPhoto = picture;
        await user.save();
      } else {
        user = await User.create({ name, email: email.toLowerCase(), googleId, avatarPhoto: picture || null });
      }
    }

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(401).json({ error: 'Google sign-in failed: ' + err.message });
  }
});

/* GET /api/auth/me */
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

/* POST /api/auth/logout  (stateless JWT — client drops token) */
router.post('/logout', requireAuth, (_req, res) => {
  res.json({ ok: true });
});

module.exports = router;
