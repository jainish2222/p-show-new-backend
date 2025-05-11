const mongoose = require('mongoose');

const dbconnect = async () => {
  try {
      await mongoose.connect("mongodb+srv://jainishkoladiya33:K2fYn6J2w3RTxQT6@cluster0.clsj52w.mongodb.net/auth");
      console.log('Connected to the database');
  } catch (error) {
      console.error('Error connecting to the database:', error.message);
  }
};

dbconnect();
module.exports = { FormData };

