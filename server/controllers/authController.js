const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findByEmail, createUser, updatePassword, updateProfile } = require('../repositories/userRepository');

const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const createToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

const validateCredentials = ({ name, email, password } = {}, isRegistration) => {
  const errors = [];

  if (isRegistration && (!name || name.trim().length < 2 || name.trim().length > 80)) {
    errors.push('Name must be between 2 and 80 characters');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push('Please provide a valid email address');
  }
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  return errors;
};

const register = async (req, res) => {
  const body = req.body || {};
  const { name, email, password } = body;
  const errors = validateCredentials(body, true);

  if (errors.length) {
    return res.status(400).json({ message: 'Validation Error', errors });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await findByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await createUser({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashedPassword,
    });

    res.cookie('expense_token', createToken(user.id), cookieOptions);
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    return res.status(500).json({ message: 'Unable to create account' });
  }
};

const login = async (req, res) => {
  const body = req.body || {};
  const { email, password } = body;
  const errors = validateCredentials(body, false);

  if (errors.length) {
    return res.status(400).json({ message: 'Validation Error', errors });
  }

  try {
    const user = await findByEmail(email.trim().toLowerCase(), true);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.cookie('expense_token', createToken(user.id), cookieOptions);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to log in' });
  }
};

const logout = (req, res) => {
  res.clearCookie('expense_token', {
    httpOnly: true,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
  });
  return res.json({ message: 'Logged out successfully' });
};

const getCurrentUser = (req, res) => res.json({ user: publicUser(req.user) });

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ message: 'Validation Error', errors: ['A current password and a new password of at least 8 characters are required'] });
  }
  try {
    const user = await findByEmail(req.user.email, true);
    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    await updatePassword(req.user.id, await bcrypt.hash(newPassword, 12));
    return res.json({ message: 'Password changed successfully' });
  } catch (error) { console.error(error); return res.status(500).json({ message: 'Unable to change password' }); }
};

const updateUserProfile = async (req, res) => {
  const { name, email } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Validation Error', errors: ['Name must be 2-80 characters and email must be valid'] });
  }
  try {
    const existing = await findByEmail(normalizedEmail);
    if (existing && existing.id !== req.user.id) return res.status(409).json({ message: 'An account with this email already exists' });
    return res.json({ user: await updateProfile(req.user.id, name.trim(), normalizedEmail) });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'An account with this email already exists' });
    console.error(error);
    return res.status(500).json({ message: 'Unable to update profile' });
  }
};

module.exports = { register, login, logout, getCurrentUser, changePassword, updateUserProfile };
