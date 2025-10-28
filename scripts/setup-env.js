#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('🚀 SmartNotes Setup Wizard');
  console.log('========================\n');

  console.log('This script will help you set up the environment variables needed for SmartNotes.\n');

  // Database setup
  console.log('📊 Database Configuration');
  console.log('You need a PostgreSQL database. You can use:');
  console.log('1. Local PostgreSQL installation');
  console.log('2. Supabase (free tier available)');
  console.log('3. Railway, Neon, or other cloud providers\n');

  const dbUrl = await question('Enter your DATABASE_URL (e.g., postgresql://username:password@localhost:5432/smartnotes): ');
  
  // NextAuth setup
  console.log('\n🔐 NextAuth Configuration');
  const nextAuthSecret = await question('Enter NEXTAUTH_SECRET (or press Enter for auto-generated): ');
  const nextAuthUrl = await question('Enter NEXTAUTH_URL (default: http://localhost:3000): ') || 'http://localhost:3000';

  // OpenAI setup
  console.log('\n🤖 OpenAI Configuration');
  console.log('You need an OpenAI API key for transcription and AI features.');
  console.log('Get your API key from: https://platform.openai.com/api-keys\n');
  const openaiKey = await question('Enter your OPENAI_API_KEY: ');

  // Google OAuth (optional)
  console.log('\n🔗 Google OAuth (Optional)');
  console.log('Skip this if you only want email/password authentication.\n');
  const googleClientId = await question('Enter GOOGLE_CLIENT_ID (or press Enter to skip): ');
  const googleClientSecret = await question('Enter GOOGLE_CLIENT_SECRET (or press Enter to skip): ');

  // Generate NextAuth secret if not provided
  const finalNextAuthSecret = nextAuthSecret || generateRandomString(32);

  // Create .env file
  const envContent = `# Database
DATABASE_URL="${dbUrl}"

# NextAuth.js
NEXTAUTH_URL="${nextAuthUrl}"
NEXTAUTH_SECRET="${finalNextAuthSecret}"

# OpenAI
OPENAI_API_KEY="${openaiKey}"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="${googleClientId || ''}"
GOOGLE_CLIENT_SECRET="${googleClientSecret || ''}"

# Environment
NODE_ENV="development"
`;

  fs.writeFileSync('.env', envContent);
  console.log('\n✅ Environment file created successfully!');

  // Database setup instructions
  console.log('\n📋 Next Steps:');
  console.log('1. Make sure your PostgreSQL database is running');
  console.log('2. Run: npm run db:push');
  console.log('3. Run: npm run dev');
  console.log('\n🎉 Setup complete! Your SmartNotes app is ready to use.');

  rl.close();
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

setupEnvironment().catch(console.error);
