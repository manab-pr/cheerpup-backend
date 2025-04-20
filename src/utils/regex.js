// regex for email and phone number format check

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?\d{10,15}$/;

module.exports = {
  emailRegex,
  phoneRegex,
};