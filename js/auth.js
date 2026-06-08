/**
 * WorkHive - Authentication Module
 * 
 * Issue #1-5: User Registration
 * Issue #30-31: Login functionality
 * 
 * Phase 1: Simple authentication (check email exists, plain text password)
 * Phase 2: JWT authentication with bcrypt password hashing
 */

// VALIDATION FUNCTIONS
function validateName(name) {
  return name && name.trim().length > 0;
}

function validateEmail(email) {
  if (!email) return false;
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function validatePhone(phone) {
  if (!phone) return false;
  // Phone should be 10-15 digits
  const phoneRegex = /^\d{10,15}$/;
  return phoneRegex.test(phone.trim());
}

function validateRole(role) {
  return role === 'owner' || role === 'coworker';
}

function validatePassword(password) {
  return password && password.length >= 6;
}

/**
 * REGISTRATION HANDLER
 * 
 * @param {Object} userData - User registration data
 * @returns {Object} - { success: boolean, message: string, user: Object|null }
 */
async function handleRegistration(userData) {
  const { firstName, middleName, lastName, email, phone, role, password } = userData;
  
  // Client-side validation
  if (!validateName(firstName)) {
    return { success: false, message: 'First name is required.', user: null };
  }
  if (!validateName(lastName)) {
    return { success: false, message: 'Last name is required.', user: null };
  }
  if (!validateEmail(email)) {
    return { success: false, message: 'Please enter a valid email address.', user: null };
  }
  if (!validatePhone(phone)) {
    return { success: false, message: 'Phone number must be 10-15 digits.', user: null };
  }
  if (!validateRole(role)) {
    return { success: false, message: 'Please select a valid role (owner or coworker).', user: null };
  }
  if (!validatePassword(password)) {
    return { success: false, message: 'Password must be at least 6 characters.', user: null };
  }
  
  // Check if email already exists
  const existingUser = getUserByEmail(email);
  if (existingUser) {
    return { success: false, message: 'An account with this email already exists.', user: null };
  }
  
  // Create new user
  const newUser = createUser(firstName, middleName || '', lastName, email, phone, role, password);
  
  // Auto-login after registration
  setCurrentUser(newUser);
  
  return { success: true, message: 'Account created successfully! Welcome to WorkHive.', user: newUser };
}

/**
 * LOGIN HANDLER
 * 
 * @param {Object} loginData - Login credentials
 * @returns {Object} - { success: boolean, message: string, user: Object|null }
 */
async function handleLogin(loginData) {
  const { email, password } = loginData;
  
  // Validate input
  if (!email || !password) {
    return { success: false, message: 'Please enter both email and password.', user: null };
  }
  
  if (!validateEmail(email)) {
    return { success: false, message: 'Please enter a valid email address.', user: null };
  }
  
  // Find user by email (Issue #31: Simple auth - check if email exists)
  const user = getUserByEmail(email);
  
  if (!user) {
    return { success: false, message: 'No account found with this email address.', user: null };
  }
  
  // Phase 1: Simple password check (plain text)
  // Phase 2: Use bcrypt.compare(password, user.password)
  if (user.password !== password) {
    return { success: false, message: 'Incorrect password. Please try again.', user: null };
  }
  
  // Set current user session
  setCurrentUser(user);
  
  return { 
    success: true, 
    message: 'Login successful!', 
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    }
  };
}

/**
 * LOGOUT HANDLER
 */
function handleLogout() {
  clearCurrentUser();
  // Redirect to WorkHive root index.html
  // Calculate path depth from WorkHive directory
  const path = window.location.pathname;
  const segments = path.split('/').filter(s => s && s !== '');
  
  // Find WorkHive in the path
  let workhiveIndex = segments.indexOf('WorkHive');
  if (workhiveIndex === -1) {
    // Fallback: go up 2 levels
    window.location.href = '../../index.html';
    return;
  }
  
  // Count directory levels from WorkHive (exclude the filename)
  const levelsToGoUp = segments.length - workhiveIndex - 2;
  
  let upPath = '';
  for (let i = 0; i < levelsToGoUp; i++) {
    upPath += '../';
  }
  window.location.href = upPath + 'index.html';
}

// CHECK IF USER IS LOGGED IN
function isLoggedIn() {
  return getCurrentUser() !== null;
}

// GET CURRENT USER ROLE
function getCurrentUserRole() {
  const user = getCurrentUser();
  return user ? user.role : null;
}

/**
 * REQUIRE LOGIN - Redirect if not logged in
 */
function requireLogin(redirectUrl = '../auth/login.html') {
  if (!isLoggedIn()) {
    window.location.href = redirectUrl;
    return false;
  }
  return true;
}

/**
 * REQUIRE ROLE - Redirect if user doesn't have required role
 * @param {string} requiredRole - 'owner' or 'coworker'
 * @param {string} redirectUrl - Where to redirect if role doesn't match
 */
function requireRole(requiredRole, redirectUrl) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = '../auth/login.html';
    return false;
  }
  if (user.role !== requiredRole) {
    window.location.href = redirectUrl;
    return false;
  }
  return true;
}

/**
 * SETUP NAVIGATION BASED ON USER ROLE
 * Call this on every page to set up role-based navigation
 */
function setupRoleBasedNavigation() {
  const user = getCurrentUser();
  const navContainer = document.querySelector('.main-nav');
  
  if (!navContainer) return;
  
  // Check if navigation already has correct links (avoid overwriting)
  const existingLinks = navContainer.querySelectorAll('a');
  let hasCorrectLinks = false;
  
  if (existingLinks.length > 0) {
    const hrefs = Array.from(existingLinks).map(a => a.href);
    // Check if Search Workspaces link exists (coworker page)
    // OR if dashboard/properties links exist (owner page)
    // OR if login.html is used for logout
    hasCorrectLinks = hrefs.some(h => h.includes('search.html') || 
                                       h.includes('dashboard.html') || 
                                       h.includes('properties/create.html') ||
                                       h.includes('login.html'));
  }
  
  // Only overwrite if links are missing or incorrect
  if (hasCorrectLinks) {
    // Update user greeting, but preserve existing structure
    const greetingEl = navContainer.querySelector('.user-greeting');
    if (greetingEl && user) {
      greetingEl.textContent = `Welcome, ${user.firstName}`;
    }
    
    // Setup logout handler only on links with "Log Out" text
    const logoutLinks = navContainer.querySelectorAll('a');
    logoutLinks.forEach(link => {
      const text = link.textContent.trim();
      // Only add logout handler to links that say "Log Out"
      if (text === 'Log Out' && !link.getAttribute('onclick')) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          handleLogout();
        });
      }
    });
    
    return; // Don't overwrite existing correct navigation
  }
  
  if (!user) {
    // Logged out navigation
    navContainer.innerHTML = `
      <ul>
        <li><a href="../index.html">Home</a></li>
        <li><a href="login.html">Log In</a></li>
        <li><a href="register.html">Sign Up</a></li>
      </ul>
    `;
  } else if (user.role === 'owner') {
    // Owner navigation
    navContainer.innerHTML = `
      <ul>
        <li><a href="../index.html">Home</a></li>
        <li><a href="dashboard.html">My Dashboard</a></li>
        <li><a href="properties/create.html">Add Property</a></li>
        <li><span class="user-greeting">Welcome, ${user.firstName}</span></li>
        <li><a href="#" onclick="handleLogout(); return false;">Log Out</a></li>
      </ul>
    `;
  } else if (user.role === 'coworker') {
    // Coworker navigation
    navContainer.innerHTML = `
      <ul>
        <li><a href="../index.html">Home</a></li>
        <li><a href="search.html">Search Workspaces</a></li>
        <li><span class="user-greeting">Welcome, ${user.firstName}</span></li>
        <li><a href="#" onclick="handleLogout(); return false;">Log Out</a></li>
      </ul>
    `;
  }
}

/**
 * REGISTER FORM SUBMIT HANDLER
 * Attach this to the registration form
 */
function setupRegistrationForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const userData = {
      firstName: formData.get('firstName'),
      middleName: formData.get('middleName') || '',
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      role: formData.get('role') || 'coworker',
      password: formData.get('password')
    };
    
    const result = await handleRegistration(userData);
    
    if (result.success) {
      showMessage(result.message, 'success');
      // Redirect based on role
      setTimeout(() => {
        if (userData.role === 'owner') {
          window.location.href = '../owner/dashboard.html';
        } else {
          window.location.href = '../coworker/search.html';
        }
      }, 1500);
    } else {
      showMessage(result.message, 'error');
    }
  });
}

/**
 * LOGIN FORM SUBMIT HANDLER
 */
function setupLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const loginData = {
      email: formData.get('email'),
      password: formData.get('password')
    };
    
    const result = await handleLogin(loginData);
    
    if (result.success) {
      showMessage(result.message, 'success');
      // Redirect based on role
      setTimeout(() => {
        if (result.user.role === 'owner') {
          window.location.href = '../owner/dashboard.html';
        } else {
          window.location.href = '../coworker/search.html';
        }
      }, 1000);
    } else {
      showMessage(result.message, 'error');
    }
  });
}

/**
 * SHOW MESSAGE HELPER
 */
function showMessage(message, type) {
  const messageEl = document.getElementById('loginMessage') || 
                    document.getElementById('registerMessage') ||
                    document.getElementById('propertyMessage') ||
                    document.getElementById('workspaceMessage') ||
                    document.getElementById('dashboardMessage');
  
  if (messageEl) {
    messageEl.className = `alert alert-${type}`;
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 5000);
  } else {
    alert(message);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Setup role-based navigation on all pages
  setupRoleBasedNavigation();
  
  // Setup forms if they exist on the page
  setupRegistrationForm();
  setupLoginForm();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleRegistration,
    handleLogin,
    handleLogout,
    isLoggedIn,
    getCurrentUserRole,
    requireLogin,
    requireRole,
    setupRoleBasedNavigation,
    setupRegistrationForm,
    setupLoginForm,
    showMessage,
    validateEmail,
    validatePhone,
    validateName
  };
}
