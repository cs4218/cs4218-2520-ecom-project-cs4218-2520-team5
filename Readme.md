# CS4218 Project - Virtual Vault

## 1. Project Introduction

Virtual Vault is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) e-commerce website, offering seamless connectivity and user-friendly features. The platform provides a robust framework for online shopping. The website is designed to adapt to evolving business needs and can be efficiently extended.

## 2. Website Features

- **User Authentication**: Secure user authentication system implemented to manage user accounts and sessions.
- **Payment Gateway Integration**: Seamless integration with popular payment gateways for secure and reliable online transactions.
- **Search and Filters**: Advanced search functionality and filters to help users easily find products based on their preferences.
- **Product Set**: Organized product sets for efficient navigation and browsing through various categories and collections.

## 3. Your Task

- **Unit and Integration Testing**: Utilize Jest for writing and running tests to ensure individual components and functions work as expected, finding and fixing bugs in the process.
- **UI Testing**: Utilize Playwright for UI testing to validate the behavior and appearance of the website's user interface.
- **Code Analysis and Coverage**: Utilize SonarQube for static code analysis and coverage reports to maintain code quality and identify potential issues.
- **Load Testing**: Leverage JMeter for load testing to assess the performance and scalability of the ecommerce platform under various traffic conditions.

## 4. Setting Up The Project

### 1. Installing Node.js

1. **Download and Install Node.js**:

   - Visit [nodejs.org](https://nodejs.org) to download and install Node.js.

2. **Verify Installation**:
   - Open your terminal and check the installed versions of Node.js and npm:
     ```bash
     node -v
     npm -v
     ```

### 2. MongoDB Setup

1. **Download and Install MongoDB Compass**:

   - Visit [MongoDB Compass](https://www.mongodb.com/products/tools/compass) and download and install MongoDB Compass for your operating system.

2. **Create a New Cluster**:

   - Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
   - After logging in, create a project and within that project deploy a free cluster.

3. **Configure Database Access**:

   - Create a new user for your database (if not alredy done so) in MongoDB Atlas.
   - Navigate to "Database Access" under "Security" and create a new user with the appropriate permissions.

4. **Whitelist IP Address**:

   - Go to "Network Access" under "Security" and whitelist your IP address to allow access from your machine.
   - For example, you could whitelist 0.0.0.0 to allow access from anywhere for ease of use.

5. **Connect to the Database**:

   - In your cluster's page on MongoDB Atlas, click on "Connect" and choose "Compass".
   - Copy the connection string.

6. **Establish Connection with MongoDB Compass**:
   - Open MongoDB Compass on your local machine, paste the connection string (replace the necessary placeholders), and establish a connection to your cluster.

### 3. Application Setup

To download and use the MERN (MongoDB, Express.js, React.js, Node.js) app from GitHub, follow these general steps:

1. **Clone the Repository**

   - Go to the GitHub repository of the MERN app.
   - Click on the "Code" button and copy the URL of the repository.
   - Open your terminal or command prompt.
   - Use the `git clone` command followed by the repository URL to clone the repository to your local machine:
     ```bash
     git clone <repository_url>
     ```
   - Navigate into the cloned directory.

2. **Install Frontend and Backend Dependencies**

   - Run the following command in your project's root directory:

     ```
     npm install && cd client && npm install && cd ..
     ```

3. **Add database connection string to `.env`**

   - Add the connection string copied from MongoDB Atlas to the `.env` file inside the project directory (replace the necessary placeholders):
     ```env
     MONGO_URL = <connection string>
     ```

4. **Adding sample data to database**

   - Download “Sample DB Schema” from Canvas and extract it.
   - In MongoDB Compass, create a database named `test` under your cluster.
   - Add four collections to this database: `categories`, `orders`, `products`, and `users`.
   - Under each collection, click "ADD DATA" and import the respective JSON from the extracted "Sample DB Schema".

5. **Running the Application**
   - Open your web browser.
   - Use `npm run dev` to run the app from root directory, which starts the development server.
   - Navigate to `http://localhost:3000` to access the application.

## 5. Unit Testing with Jest

Unit testing is a crucial aspect of software development aimed at verifying the functionality of individual units or components of a software application. It involves isolating these units and subjecting them to various test scenarios to ensure their correctness.  
Jest is a popular JavaScript testing framework widely used for unit testing. It offers a simple and efficient way to write and execute tests in JavaScript projects.

### Getting Started with Jest

To begin unit testing with Jest in your project, follow these steps:

1. **Install Jest**:  
   Use your preferred package manager to install Jest. For instance, with npm:

   ```bash
   npm install --save-dev jest

   ```

2. **Write Tests**  
   Create test files for your components or units where you define test cases to evaluate their behaviour.

3. **Run Tests**  
   Execute your tests using Jest to ensure that your components meet the expected behaviour.  
   You can run the tests by using the following command in the root of the directory:

   - **Frontend tests**

     ```bash
     npm run test:frontend
     ```

   - **Backend tests**

     ```bash
     npm run test:backend
     ```

   - **All the tests**
     ```bash
     npm run test
     ```

## 6. Milestone 1 - Contributions

### MS1 CI URL
**Jest CI:** //insert link here

### 6.1 Ang Yi Jie, Ivan

**Category Controllers (categoryController.js)**
- Fixed missing 404 handling for update, delete, and single category lookups
- Fixed undefined variable bug in the controller
- Corrected typos in controller and routes

**createCategoryController**
- Tested missing and empty name input (401 response)
- Tested duplicate category handling (200 response)
- Tested successful category creation with slugify (201 response)
- Tested database error handling (500 response)
- Mocked categoryModel and slugify to isolate controller logic

**updateCategoryController**
- Tested successful update with correct payload and slug generation (200 response)
- Tested category not found case (404 response)
- Tested database error handling (500 response)

**deleteCategoryController**
- Tested successful deletion by ID (200 response)
- Tested category not found case (404 response)
- Tested database error handling (500 response)

**categoryController (get all)**
- Tested successful retrieval of all categories (200 response)
- Tested database error handling (500 response)

**singleCategoryController**
- Tested successful retrieval by slug (200 response)
- Tested category not found case (404 response)
- Tested database error handling (500 response)

**CreateCategory.js**
- Tested page heading and form rendering
- Tested fetching and displaying categories on mount
- Tested error toast when category fetch fails
- Tested successful category creation with list refresh
- Tested error toast when server returns success=false on creation and on network errors
- Tested edit modal opens pre-filled with existing category name
- Tested successful category update with modal close
- Tested error toast on update failure and network errors
- Tested modal dismissal via cancel button
- Tested successful category deletion with list refresh
- Tested error toast on delete failure and network errors
- Mocked axios, react-hot-toast, Layout, AdminMenu, and antd Modal

**CategoryForm.js**
- Tested rendering of input field and submit button
- Tested that provided value is displayed in the input
- Tested that setValue is called on input change
- Tested that handleSubmit is called on form submission

**useCategory hook**
- Tested successful category fetch from API on mount
- Tested initial empty array state before API responds
- Tested empty array is maintained on API failure

**Categories.js**
- Tested that a link is rendered for each category returned by useCategory
- Tested that each link points to the correct `/category/:slug` route
- Tested that no links are rendered when there are no categories
- Mocked useCategory hook and Layout to isolate component

**AdminMenu.js**
- Tested Admin Panel heading renders
- Tested all nav links (Create Category, Create Product, Products, Orders) with correct routes

**AdminDashboard.js**
- Tested rendering of admin name, email, and phone from auth context
- Tested graceful rendering when auth user is null
- Tested that AdminMenu component is rendered
- Mocked useAuth, Layout, and AdminMenu

**CI Setup**
- Configured GitHub Actions workflow for automated testing pipeline

### 6.2 Ong Xin Hui Lynnette (A0257058X)

All test files below were written with the assistance of AI.

#### Frontend Unit Tests

**1. Auth Context (6 tests)**
- Tested: children rendering (1), default state with null user and empty token (1), localStorage loading on mount (1), no-op when no stored data (1), axios Authorization header sync (2)
- Key Features: localStorage-driven auth hydration, axios default header injection, graceful handling of missing stored data
- Mocking: Storage.prototype.getItem (jest.spyOn)
- Style: State-based (auth state values), Communication-based (axios header, localStorage interaction)

**2. Login Page (8 tests)**
- Tested: form rendering with heading/fields (1), initial empty inputs (1), input typing (1), successful login with auth context + localStorage update + navigation (1), error toast on `success: false` (1), generic error toast on network failure (1), forgot-password navigation (1), submit button attributes (1)
- Key Features: Auth context update via `setAuth`, localStorage persistence of login response, toast notifications with custom styling, route navigation on forgot-password click
- Mocking: axios, react-hot-toast, useAuth, useCart, useSearch, useCategory, localStorage, matchMedia; custom `renderLogin()` helper with MemoryRouter
- Style: Output-based (form display), State-based (input values), Communication-based (API calls, auth context, localStorage, navigation)

**3. Register Page (7 tests)**
- Tested: form rendering with all 7 fields (1), initial empty inputs (1), field input typing (1), successful registration with navigation to login (1), error toast on `success: false` (1), generic error toast on network failure (1), submit button attributes (1)
- Key Features: `fillForm` helper for consistent test data setup (name, email, password, phone, address, DOB, answer), API payload verification, navigation to `/login` on success
- Mocking: axios, react-hot-toast, useAuth, useCart, useSearch, useCategory, localStorage, matchMedia; custom `renderRegister()` helper with MemoryRouter
- Style: Output-based (form rendering), Communication-based (API calls, toast, navigation)

**4. Profile Page (7 tests)**
- Tested: pre-filled user data from auth context (1), disabled email field (1), field editing (1), successful update with auth context refresh + localStorage sync (1), error toast on `data.error` response (1), generic error toast on network failure (1), heading and button rendering (1)
- Key Features: Auth-context-driven form pre-fill, disabled email prevents editing, `setAuth` + `localStorage.setItem` called on successful update, `axios.put` payload verification
- Mocking: axios, react-hot-toast, useAuth, useCart, useSearch, useCategory, localStorage (with pre-populated user data), matchMedia; custom `renderProfile()` helper
- Style: Output-based (display), State-based (field editing), Communication-based (API, auth context, localStorage)

**5. Dashboard Page (3 tests)**
- Tested: user details display in card (name, email, address) (1), UserMenu navigation links rendering (1), h3 element verification for all 3 user fields (1)
- Mocking: useAuth (with mock user data), useCart, useSearch, useCategory, localStorage, matchMedia
- Style: Output-based

**6. UserMenu Component (3 tests)**
- Tested: Dashboard heading renders (1), Profile link with correct `/dashboard/user/profile` route (1), Orders link with correct `/dashboard/user/orders` route (1)
- Mocking: MemoryRouter for react-router-dom
- Style: Output-based

**7. PrivateRoute Component (4 tests)**
- Tested: authenticated access renders protected outlet (1), spinner on API authorization rejection (1), spinner and no API call on missing auth token (1), spinner and no API call on null auth (1)
- Key Features: Auth-gated rendering via `/api/v1/auth/user-auth` check, conditional Outlet vs Spinner display, API call skipped when token is empty or auth is null
- Mocking: axios, useAuth, useCart, useSearch, Spinner (replaced with MockSpinner), localStorage, matchMedia; custom `renderPrivateRoute()` helper with nested routes
- Style: State-based (conditional rendering), Communication-based (API verification)

#### Backend Unit Tests

**8. Auth Controller (24 tests)**
- **registerController (9 tests):** Tested field validation for all 6 required fields (name, email, password, phone, address, answer), duplicate user handling (200 with `success: false`), successful registration with password hashing (201), database error handling (500)
- **loginController (7 tests):** Tested missing email (404), missing password (404), both missing (404), user not found (404), wrong password (200 with `success: false`), successful login with JWT token generation and 7-day expiry (200), database error handling (500)
- **forgotPasswordController (6 tests):** Tested missing email (400), missing answer (400), missing newPassword (400), wrong email/answer combination (404), successful password reset with hashing + `findByIdAndUpdate` (200), database error handling (500)
- **testController (2 tests):** Tested "Protected Routes" success response, error handling when `res.send` throws
- Key Features: JWT signing with `expiresIn: "7d"`, password hashing via `hashPassword`, user lookup via `findOne`, password update via `findByIdAndUpdate`
- Mocking: userModel (jest.unstable_mockModule with constructor + findOne + findById + findByIdAndUpdate), authHelper (hashPassword, comparePassword), jsonwebtoken (sign, verify), req/res objects with chainable mocks
- Style: State-based (response objects), Communication-based (model method calls, hashing, JWT)

**9. Auth Helper (4 tests)**
- **hashPassword (2 tests):** Tested successful hash with 10 salt rounds, error returns undefined
- **comparePassword (2 tests):** Tested match returns true, mismatch returns false
- Mocking: bcrypt (jest.unstable_mockModule for hash, compare)
- Style: Output-based (return values)

**10. Auth Middleware (6 tests)**
- **requireSignIn (3 tests):** Tested valid token decode sets `req.user` and calls next, invalid token does not call next, missing authorization header does not call next
- **isAdmin (3 tests):** Tested admin role (`role: 1`) calls next, non-admin role (`role: 0`) returns 401 with "UnAuthorized Access", database lookup failure returns 401 with error
- Key Features: JWT verification via `jsonwebtoken.verify`, role-based access control via `userModel.findById`
- Mocking: jsonwebtoken (jest.unstable_mockModule), userModel (jest.unstable_mockModule), req/res/next objects
- Style: Communication-based (next, verify calls), State-based (response objects)

**11. User Model (9 tests)**
- Tested: name field (String, required, trim) (1), email field (String, required, unique) (1), password field (String, required) (1), phone field (String, required) (1), address field (required) (1), answer field (String, required) (1), role field (Number, default 0) (1), timestamps enabled (1), model name `'users'` (1)
- Mocking: None (direct schema/model testing)
- Style: Output-based (schema validation)

#### Others
- Organised discussions, work delegation for sprint and for AI-Driven Testing Plan

### 6.3 Alyssa Ong Yi Xian
#### 1. **Header Component**(20 tests, 100% coverage)
   - **Tested:** Brand name (1), search input (1), navigation links (3), auth state rendering (6), logout functionality (3), cart badge (3), categories dropdown (6)
   - **Key Features:** Role-based dashboard routing (admin vs user), auth-conditional rendering (guest vs authenticated), cart count badge, dynamic categories, logout clears auth/localStorage/shows toast
   - **Mocking:** useAuth, useCart, useCategory, toast, SearchInput, Badge (antd), localStorage
   - **Style:** Output-based (display), Communication-based (logout interactions)

#### 2. **Footer Component** (9 tests)
   - Tested copyright display and navigation links (About, Contact, Privacy Policy)
   - Verified all links point to correct paths (/about, /contact, /policy)
   - **Mocking:** MemoryRouter for react-router-dom
   - **Style:** Output-based

#### 3. **Layout Component** (15 tests)
   - Tested children rendering, Header/Footer/Toaster integration, and meta tags
   - Verified default vs custom props (title, description, keywords, author)
   - **Mocking:** Header, Footer, Toaster components; react-helmet
   - **Style:** Output-based

#### 4. **Spinner Component** (12 tests)
   - Tested 3-second countdown, navigation on completion, timer cleanup on unmount
   - Verified accessibility text, custom path support, layout rendering
   - **Mocking:** jest.useFakeTimers(), useNavigate, useLocation
   - **Style:** State-based (countdown) and Communication-based (navigation)

---

#### Frontend Pages

#### 5. **HomePage Component** (20 tests)
   - **Tested:** Product display (3), category filters (2), cart functionality (2), navigation (1), pagination (2), error handling (3), price filters (3), load more (3), reset filters (1)
   - **Key Features:** USD formatting, description truncation, filter API calls, localStorage sync, conditional Load More button, comprehensive error handling
   - **Mocking:** axios, cart context, toast, useNavigate, custom renderHomePage() helper
   - **Style:** Output-based (display), State-based (pagination), Communication-based (API/navigation)

#### 6. **CartPage Component** (22 tests)
   - **Tested:** Guest/auth states (2), empty cart (1), cart display (5), item management (2), address handling (4), navigation (1), payment UI (7)
   - **Key Features:** Auth-based rendering, total price calculation, localStorage sync, conditional payment UI, comprehensive error handling
   - **Mocking:** axios, auth/cart contexts, useNavigate, localStorage, custom renderCartPage() helper (eliminates act warnings)
   - **Style:** Output-based (display), State-based (cart updates), Communication-based (API/navigation)
   - **Coverage Gap:** Lines 63-77, 182 (Braintree DropIn integration)

#### 7. **About Page** (6 tests)
   - Tested page title, image attributes, company messages (welcome, service commitment, shopping experience)
   - **Mocking:** Layout component
   - **Style:** Output-based

#### 8. **Contact Page** (9 tests)
   - Tested page title, heading, contact methods (email, phone, toll-free), image, icons
   - **Mocking:** Layout component
   - **Style:** Output-based

#### 9. **Policy Page** (10 tests)
   - Tested page title, image, 7 policy sections (privacy value, data collection, sharing, payment security, user rights, cookies, contact)
   - **Mocking:** Layout component
   - **Style:** Output-based

#### 10. **Pagenotfound (404) Page** (6 tests)
   - Tested page title, 404 code, error message, "Go Back" link to home page
   - **Mocking:** Layout and Link components
   - **Style:** Output-based

#### 11. **Orders Page (User)** (9 tests)
   - Tested auth-gated rendering, API calls only with token, order display, payment status (Success/Failed), error handling
   - **Mocking:** axios, auth context, UserMenu, moment, custom async helper
   - **Style:** State-based (conditional rendering), Communication-based (API), Output-based (display)

---

#### Frontend Context

#### 12. **Cart Context** (11 tests, 100% coverage)
   - **Tested:** Initial state (4) - empty cart, localStorage loading, invalid JSON, errors; State updates (4) - setCart, add/remove items, clear cart; Context behavior (3) - return value, children rendering
   - **Key Features:** localStorage sync, error resilience, proper context API
   - **Mocking:** localStorage with Object.defineProperty
   - **Style:** State-based (cart changes), Output-based (context value)
   - **Fixed Brittleness:** Removed localStorage.getItem call verification

---

#### Backend Controllers

#### 13. **Order Controller** (100+ tests, 2813 lines)
   - **Controllers:** updateProfileController, getOrdersController, getAllOrdersController, orderStatusController
   - **Tested:** Authentication (401), input validation (400), success paths (200), error handling (500), password hashing, mongoose query chaining
   - **Mocking:** userModel, orderModel, hashPassword, req/res objects
   - **Style:** State-based (response objects), Communication-based (model method calls)

---

#### Backend Models

#### 14. **Order Model** (4 tests)
   - Tested default status ("Not Process"), enum validation (5 statuses), invalid status rejection, ObjectId array
   - **Mocking:** None (direct model testing)
   - **Style:** Output-based (schema validation)

---

#### Backend Configuration

#### 15. **Database Connection (db.js)** (4 tests)
   - Tested mongoose.connect with MONGO_URL, success/error logging, non-throwing error handling
   - **Mocking:** mongoose (unstable_mockModule), console.log, String.prototype.bgMagenta/bgRed (colors library)
   - **Style:** Communication-based (verify interactions and logs)

---

### 6.4 Premakumar Meenu Lekha

**productController**

- Tested all major controller methods (create, read, update, delete, list, filter, search, related products, category-based listing).
- Tested input validation, missing fields, and file/photo handling (presence, size, content-type).
- Verified successful CRUD flows, pagination, filtering, product counts, and search behaviour.
- Tested related products and category-based retrieval.
- Mocked `productModel`, `categoryModel`, `fs`, and `slugify` to isolate controller logic.
- Validated correct HTTP status codes, JSON responses, and error handling for failure scenarios.


**AdminOrders Component**

- Tested component rendering and successful order data display.
- Verified order status update flow triggers correct API call and payload.
- Mocked `axios`, `useAuth`, `AdminMenu`, `Layout`, and `antd.Select` for stable tests.
- Resolved Ant Design portal issues by mocking `Select` to a native `<select>`.


**Users Component**

- Tested successful component rendering.
- Verified presence of key static UI elements (e.g. “All Users” heading).
- Mocked `AdminMenu` and `Layout` to isolate component behaviour.


### 6.5 Koo Zhuo Hui

1. **Payment Controllers**
   - brainTreeTokenController
      - Tested successful token generation.
      - Tested error handling scenario.
   - brainTreePaymentController
      - Fixed and improved controller method to handle missing inputs
      - Tested input validation (including missing inputs)
      - Tested successful payment flow
      - Tested failed transaction scenarios
      - Mocked payment gateway, Orders model, and braintree callback functions.
      - Added proper error handling safeguards.
2. **SearchInput.js**
   - Tested proper class names and attributes.
   - Tested initial empty input state, with updates and clearing functionality.
   - Validated form submission behavior (e.g. number of API calls)
   - Verified number of results returned by API
   - Tested edge cases such as empty input search, multiple form submissions, error handling.
3. **Context/Search.js**
   - Made use of sample products for testing
   - Fixed erroneous attributes, and missing button functionality to
   'Add to Cart' and 'More Details'
   - Mocked useCart and useNavigation to isolate dependencies
   - Tested product details and images rendering
   - Tested Description truncation for long descriptions
   - Tested proper navigation and behaviour of the 'Add to Cart' and 'More Details' buttons
4. **Search Context**
   - Fixed erroneous naming of variables for SearchProvider
   - Verified SearchProvider renders children correctly
   - Validated default context state initialization
   - Test state updates:
      - Setter function updates keywords and results
      - Component re-renders correctly after updates
   - Test multiple sequential state updates using renderHook
   - Verified state persistence across mulitple children components.
5. **Other bug fixes**
   - Fixed 'Add to Cart' functionality in ProductDetails.js

