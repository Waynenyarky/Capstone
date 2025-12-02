const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
	firstName: { type: String, required: true, trim: true },
	lastName: { type: String, required: true, trim: true },
	email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true }, // Explicit index
	phoneNumber: { type: String, required: true, trim: true },
	password: { type: String, required: true },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();
	try {
		const salt = await bcrypt.genSalt(10); // Ensure salt rounds are set to 10
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (err) {
		next(err);
	}
});

module.exports = mongoose.model('User', userSchema);
