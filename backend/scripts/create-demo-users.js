// Script to create demo users for KhoAugment POS with correct credentials
import bcrypt from 'bcryptjs';

const API_URL = 'https://kho1-api-production.bangachieu2.workers.dev';

// Demo users that match the frontend LoginPage
const demoUsers = [
  {
    id: 'admin-001',
    email: 'admin@khoaugment.com',
    password: '123456',
    name: 'System Administrator',
    role: 'admin',
    phone: '+84901234567',
    position: 'Administrator'
  },
  {
    id: 'manager-001',
    email: 'manager@khoaugment.com',
    password: '123456',
    name: 'Store Manager',
    role: 'manager',
    phone: '+84901234568',
    position: 'Manager'
  },
  {
    id: 'cashier-001',
    email: 'cashier@khoaugment.com',
    password: '123456',
    name: 'Thu ngân viên',
    role: 'cashier',
    phone: '+84901234569',
    position: 'Cashier'
  }
];

async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

async function createDemoUsers() {
  console.log('Creating demo users for KhoAugment POS...');
  
  try {
    // First, ensure tables exist
    console.log('Setting up database tables...');
    const setupResponse = await fetch(`${API_URL}/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (setupResponse.ok) {
      console.log('✅ Database setup completed');
    } else {
      console.log('⚠️ Database setup may have failed, continuing...');
    }
    
    // Create each demo user
    for (const userData of demoUsers) {
      console.log(`Creating user: ${userData.email}...`);
      
      try {
        // Hash the password
        const hashedPassword = await hashPassword(userData.password);
        
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userData.email,
            password: userData.password, // Use plain password, let the API hash it
            name: userData.name,
            role: userData.role,
            phone: userData.phone,
            position: userData.position
          })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          console.log(`✅ Created user: ${userData.email}`);
        } else {
          console.log(`⚠️ User ${userData.email} may already exist or creation failed: ${result.message || result.error}`);
        }
        
      } catch (userError) {
        console.error(`❌ Error creating user ${userData.email}:`, userError.message);
      }
    }
    
    console.log('\n🎉 Demo user creation completed!');
    console.log('\nDemo Credentials:');
    demoUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
    });
    
    console.log('\nYou can now test login at: https://kho1.pages.dev/auth/login');
    
  } catch (error) {
    console.error('❌ Fatal error during demo user creation:', error);
  }
}

// Test API connectivity first
async function testAPI() {
  try {
    console.log('Testing API connectivity...');
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      console.log('✅ API is reachable');
      return true;
    } else {
      console.log('⚠️ API responded with status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ API is not reachable:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('KhoAugment POS Demo User Creator');
  console.log('================================');
  
  const apiReachable = await testAPI();
  
  if (!apiReachable) {
    console.log('\n⚠️ API is not reachable. Demo users will work in frontend mock mode.');
    console.log('Frontend mock credentials:');
    demoUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
    });
    return;
  }
  
  await createDemoUsers();
}

// Run the script
main().catch(console.error);