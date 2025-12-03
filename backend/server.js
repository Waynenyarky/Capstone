require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({ origin: '*' })); // Allow all origins during development
app.use(express.json());
// Server Port
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
	maxPoolSize: 10, // Use maxPoolSize instead of poolSize
})
	.then(() => console.log('✅ Connected to MongoDB'))
	.catch((err) => console.error('❌ MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
	firstName: { type: String, required: true, trim: true },
	lastName: { type: String, required: true, trim: true },
	email: { type: String, required: true, unique: true, lowercase: true, trim: true },
	phoneNumber: { type: String, required: true, trim: true },
	password: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Routes

// Health Check
app.get('/', (req, res) => {
	res.json({ message: 'Backend server is running!' });
});

// Sign Up Route
app.post('/api/auth/signup', async (req, res) => {
	try {
		console.log('Incoming signup request:', req.body);

		const { firstName, lastName, email, phoneNumber, password, confirmPassword } = req.body;

		// Validate required fields
		if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
			console.log('Validation error: Missing fields');
			return res.status(400).json({
				success: false,
				message: 'All fields are required',
			});
		}

		// Validate password confirmation
		if (password !== confirmPassword) {
			console.log('Validation error: Passwords do not match');
			return res.status(400).json({
				success: false,
				message: 'Passwords do not match',
			});
		}

		// Check if user already exists
		console.time('Check existing user');
		const existingUser = await User.findOne({ email });
		console.timeEnd('Check existing user');

		if (existingUser) {
			console.log('Validation error: Email already registered');
			return res.status(400).json({
				success: false,
				message: 'Email already registered',
			});
		}

		// Hash password
		console.time('Hash password');
		const hashedPassword = await bcrypt.hash(password, 10);
		console.timeEnd('Hash password');

		// Create new user
		console.time('Create new user');
		const newUser = new User({
			firstName,
			lastName,
			email,
			phoneNumber,
			password: hashedPassword,
		});

		await newUser.save();
		console.timeEnd('Create new user');

		console.log('User created successfully:', newUser);

		res.status(201).json({
			success: true,
			message: 'Account created successfully',
			user: {
				id: newUser._id,
				firstName: newUser.firstName,
				lastName: newUser.lastName,
				email: newUser.email,
				phoneNumber: newUser.phoneNumber,
			},
		});
	} catch (error) {
		console.error('Signup error:', error);
		res.status(500).json({
			success: false,
			message: 'Server error. Please try again later.',
		});
	}
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
	try {
		console.log('Incoming login request:', req.body);

		const { email, password } = req.body;

		// Validate required fields
		if (!email || !password) {
			console.log('Validation error: Missing email or password');
			return res.status(400).json({
				success: false,
				message: 'Email and password are required',
			});
		}

		// Find user by email
		const user = await User.findOne({ email });
		if (!user) {
			console.log('Authentication error: Invalid email');
			return res.status(401).json({
				success: false,
				message: 'Invalid email or password',
			});
		}

		// Check password
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			console.log('Authentication error: Invalid password');
			return res.status(401).json({
				success: false,
				message: 'Invalid email or password',
			});
		}

		// Generate JWT token
		const token = jwt.sign(
			{ userId: user._id, email: user.email },
			process.env.JWT_SECRET,
			{ expiresIn: '7d' }
		);

		console.log('Login successful:', user);

		res.json({
			success: true,
			message: 'Login successful',
			token,
			user: {
				id: user._id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				phoneNumber: user.phoneNumber,
			},
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({
			success: false,
			message: 'Server error. Please try again later.',
		});
	}
});

// Get User Profile (Protected Route)
app.get('/api/user/profile', authenticateToken, async (req, res) => {
	try {
		const user = await User.findById(req.user.userId).select('-password');
		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			});
		}

		res.json({
			success: true,
			user: {
				id: user._id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				phoneNumber: user.phoneNumber,
			},
		});
	} catch (error) {
		console.error('Profile error:', error);
		res.status(500).json({
			success: false,
			message: 'Server error',
		});
	}
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body;
    if (!firstName || !lastName || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { firstName, lastName, phoneNumber },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    res.json({
      success: true,
      message: 'Profile updated',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

app.put('/api/user/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required',
      });
    }
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();
    return res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

app.delete('/api/user/account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }
    await User.findByIdAndDelete(user._id);
    return res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({
			success: false,
			message: 'Access token required',
		});
	}

	jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
		if (err) {
			return res.status(403).json({
				success: false,
				message: 'Invalid or expired token',
			});
		}
		req.user = user;
		next();
	});
}

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
});
