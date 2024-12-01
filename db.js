const mongoose = require('mongoose');

const dbconnect = async () => {
  try {
      await mongoose.connect("mongodb+srv://jainishkoladiya33:UirfbhJ6RXOjWvY6@cluster0.ejj05.mongodb.net/auth");
      console.log('Connected to the database');
  } catch (error) {
      console.error('Error connecting to the database:', error.message);
  }
};

dbconnect();
module.exports = { FormData };

