const API_URL = 'http://localhost:5000';

async function runTests() {
  console.log('🏁 Starting automated API flow verification tests...');

  try {
    // 1. Admin Login
    console.log('\n🔑 Step 1: Logging in as System Admin...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@rating.com',
        password: 'Admin@Password123'
      })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Admin login failed: ${await loginRes.text()}`);
    }
    
    const adminData = await loginRes.json();
    const adminToken = adminData.token;
    console.log('✅ Admin login successful!');

    // 2. Create Store Owner
    console.log('\n👤 Step 2: Creating a Store Owner user...');
    const createOwnerRes = await fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Store Owner One',
        email: 'owner1@store.com',
        password: 'Owner@Pass123',
        address: 'Market Square, Sector 5',
        role: 'STORE_OWNER'
      })
    });

    if (!createOwnerRes.ok) {
      throw new Error(`Failed to create Store Owner: ${await createOwnerRes.text()}`);
    }
    
    const ownerData = await createOwnerRes.json();
    const ownerId = ownerData.user.id;
    console.log(`✅ Store Owner created successfully! ID: ${ownerId}`);

    // 3. Create Normal User
    console.log('\n👤 Step 3: Creating a Normal User...');
    const createUserRes = await fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Normal User One',
        email: 'user1@normal.com',
        password: 'User@Pass123',
        address: 'Residential Colony, Street A',
        role: 'NORMAL_USER'
      })
    });

    if (!createUserRes.ok) {
      throw new Error(`Failed to create Normal User: ${await createUserRes.text()}`);
    }

    const userData = await createUserRes.json();
    console.log('✅ Normal User created successfully!');

    // 4. Create Store (owned by Store Owner One)
    console.log('\n🏬 Step 4: Creating a Store...');
    const createStoreRes = await fetch(`${API_URL}/admin/stores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Pizza Palace',
        email: 'pizza@palace.com',
        address: '123 Cheesy Lane, Pizza City',
        ownerId: ownerId
      })
    });

    if (!createStoreRes.ok) {
      throw new Error(`Failed to create store: ${await createStoreRes.text()}`);
    }

    const storeData = await createStoreRes.json();
    const storeId = storeData.store.id;
    console.log(`✅ Store 'Pizza Palace' created successfully! ID: ${storeId}`);

    // 5. Normal User Login
    console.log('\n🔑 Step 5: Logging in as Normal User...');
    const userLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user1@normal.com',
        password: 'User@Pass123'
      })
    });

    if (!userLoginRes.ok) {
      throw new Error(`Normal User login failed: ${await userLoginRes.text()}`);
    }

    const userLoginData = await userLoginRes.json();
    const userToken = userLoginData.token;
    console.log('✅ Normal User login successful!');

    // 6. Normal User: View stores list (verify Pizza Palace is visible)
    console.log('\n🏬 Step 6: Fetching stores as Normal User...');
    const getStoresRes = await fetch(`${API_URL}/stores`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    if (!getStoresRes.ok) {
      throw new Error(`Failed to fetch stores: ${await getStoresRes.text()}`);
    }

    const storesList = await getStoresRes.json();
    console.log(`Stores found: ${storesList.map((s: any) => s.name).join(', ')}`);
    const pizzaPalace = storesList.find((s: any) => s.name === 'Pizza Palace');
    if (!pizzaPalace) {
      throw new Error("Store 'Pizza Palace' not found in stores list");
    }
    console.log('✅ Found Pizza Palace in stores list!');

    // 7. Normal User: Submit 4-star rating
    console.log('\n⭐ Step 7: Submitting 4-star rating for Pizza Palace...');
    const submitRatingRes = await fetch(`${API_URL}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        storeId: storeId,
        rating: 4
      })
    });

    if (!submitRatingRes.ok) {
      throw new Error(`Failed to submit rating: ${await submitRatingRes.text()}`);
    }

    const ratingData = await submitRatingRes.json();
    const ratingId = ratingData.rating.id;
    console.log(`✅ Rating submitted successfully! ID: ${ratingId}`);

    // Verify rating constraint (User cannot rate same store twice)
    console.log('🔒 Verifying duplicate rating constraint...');
    const secondRatingRes = await fetch(`${API_URL}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        storeId: storeId,
        rating: 5
      })
    });
    if (secondRatingRes.ok) {
      throw new Error('Duplicate rating constraint failed (allowed rating same store twice)');
    }
    console.log('✅ Duplicate rating constraint successfully enforced! (API blocked duplicate submission)');

    // 8. Normal User: Edit rating to 5 stars
    console.log('\n✍️ Step 8: Updating rating to 5 stars...');
    const updateRatingRes = await fetch(`${API_URL}/ratings/${ratingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        rating: 5
      })
    });

    if (!updateRatingRes.ok) {
      throw new Error(`Failed to update rating: ${await updateRatingRes.text()}`);
    }
    console.log('✅ Rating updated to 5 stars successfully!');

    // 9. Store Owner Login
    console.log('\n🔑 Step 9: Logging in as Store Owner...');
    const ownerLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'owner1@store.com',
        password: 'Owner@Pass123'
      })
    });

    if (!ownerLoginRes.ok) {
      throw new Error(`Store Owner login failed: ${await ownerLoginRes.text()}`);
    }

    const ownerLoginData = await ownerLoginRes.json();
    const ownerToken = ownerLoginData.token;
    console.log('✅ Store Owner login successful!');

    // 10. Store Owner: Fetch dashboard
    console.log('\n📊 Step 10: Fetching dashboard as Store Owner...');
    const dashboardRes = await fetch(`${API_URL}/store-owner/dashboard`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });

    if (!dashboardRes.ok) {
      throw new Error(`Failed to fetch owner dashboard: ${await dashboardRes.text()}`);
    }

    const dashboard = await dashboardRes.json();
    console.log('Dashboard Data Received:', JSON.stringify(dashboard, null, 2));

    // Verify values
    if (dashboard.store.name !== 'Pizza Palace') {
      throw new Error(`Dashboard store name mismatch. Expected 'Pizza Palace', got '${dashboard.store.name}'`);
    }
    if (dashboard.averageRating !== 5) {
      throw new Error(`Dashboard average rating mismatch. Expected 5, got ${dashboard.averageRating}`);
    }
    if (dashboard.totalRatings !== 1) {
      throw new Error(`Dashboard total ratings mismatch. Expected 1, got ${dashboard.totalRatings}`);
    }
    if (dashboard.ratings[0].rating !== 5) {
      throw new Error(`Dashboard review rating mismatch. Expected 5, got ${dashboard.ratings[0].rating}`);
    }
    console.log('✅ Store Owner dashboard verified successfully!');

    // 11. Admin: View stats dashboard
    console.log('\n📊 Step 11: Verifying admin stats dashboard...');
    const adminStatsRes = await fetch(`${API_URL}/admin/dashboard`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!adminStatsRes.ok) {
      throw new Error(`Failed to fetch admin dashboard: ${await adminStatsRes.text()}`);
    }
    const adminStats = await adminStatsRes.json();
    console.log('Admin Stats:', JSON.stringify(adminStats, null, 2));
    
    // We expect: totalUsers >= 3, totalStores >= 1, totalRatings >= 1
    if (adminStats.totalUsers < 3 || adminStats.totalStores < 1 || adminStats.totalRatings < 1) {
      throw new Error('Admin statistics mismatch');
    }
    console.log('✅ Admin statistics dashboard verified successfully!');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The backend and database are fully verified.');
  } catch (error: any) {
    console.error('\n❌ Test flow failed with error:', error.message || error);
    process.exit(1);
  }
}

runTests();
