// Script to create admin user for production database
import bcrypt from 'bcryptjs';

const API_URL = 'https://kho1-api-production.bangachieu2.workers.dev';

async function createAdminUser() {
  console.log('Creating admin user...');
  
  try {
    // First, create the basic tables if they don't exist
    const createUserTableResponse = await fetch(`${API_URL}/api/v1/setup/create-tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Create tables response:', createUserTableResponse.status);
    
    // Create admin user
    const adminData = {
      email: 'admin@khoaugment.com',
      password: '123456', // Demo password
      name: 'Administrator',
      role: 'admin'
    };
    
    const response = await fetch(`${API_URL}/api/v1/setup/create-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData)
    });
    
    const result = await response.json();
    console.log('Admin creation result:', result);
    
    if (result.success) {
      console.log('✅ Admin user created successfully!');
      console.log('Email:', adminData.email);
      console.log('Password:', adminData.password);
    } else {
      console.error('❌ Failed to create admin user:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

// Run the script
createAdminUser();