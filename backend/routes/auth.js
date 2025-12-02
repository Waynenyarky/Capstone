const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assuming a User model exists
const router = express.Router();

// Signup route
router.post('/signup', async (req, res) => {
	try {
		const { username, email, password } = req.body;

		// Validate input
		if (!username || !email || !password) {
			return res.status(400).json({ message: 'All fields are required.' });
		}

		// Check if user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ message: 'User already exists.' });
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create the user
		const newUser = new User({ username, email, password: hashedPassword });
		await newUser.save();

		res.status(201).json({ message: 'User created successfully.' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal server error.' });
	}
});

// Login route
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;

		// Validate input
		if (!email || !password) {
			return res.status(400).json({ message: 'All fields are required.' });
		}

		// Find the user
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ message: 'Invalid credentials.' });
		}

		// Compare passwords
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({ message: 'Invalid credentials.' });
		}

		// Generate JWT
		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

		res.status(200).json({ token, message: 'Login successful.' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal server error.' });
	}
});

module.exports = router;
