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
**Jest CI:** https://github.com/cs4218/cs4218-2520-ecom-project-cs4218-2520-team5/actions/runs/22290909547/job/64477870057

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

## 7. Milestone 2 (Sprint 3) — Contributions

### 7.1 Ang Yi Jie, Ivan

### 7.1.1 Integration Tests (Jest, white-box, bottom-up)

**Story 1: Category API Integration (`tests/integration/categoryApiIntegration.test.js`)**
- Tests the full chain: route → `requireSignIn` → `isAdmin` → `categoryController` → `categoryModel`
- Approach: bottom-up integration using `mongodb-memory-server` (in-memory MongoDB; no real DB needed)
- Covers: create, update, delete categories via API with valid admin JWT; 401 for unauthenticated/non-admin requests
- No mocking of controller or model layers; only external MongoDB is replaced

**Story 2: Category–Product Relationship (`tests/integration/categoryProductIntegration.test.js`)**
- Tests slug-based lookups: `singleCategoryController` and `productCategoryController`
- Verifies correct category and associated products returned by slug
- Approach: bottom-up integration; routes + controllers + both models run together
- Bug fix: corrected missing closing brace in `createProductController` (`controllers/productController.js`)

**Supporting files:**
- `jest.integration.config.js` — Jest config for integration tests (ESM, node environment, 30s timeout)
- Added `test:integration` script, `mongodb-memory-server`, and `supertest` to `package.json`

### 7.1.2 UI Tests (Playwright, black-box)

**Story 3: Admin Create/Edit/Delete Category (`tests/ui/admin-category.spec.js`)**
- End-to-end flow: log in as admin → navigate to Create Category → create a new category → edit its name → delete it
- Verifies the category list updates correctly after each action
- Uses a test-only API route (`/api/v1/test/setup-admin`) to seed admin user for Playwright

**Story 4: User Category Browsing (`tests/ui/category-browsing.spec.js`)**
- End-to-end flow: navigate to Categories page → click a category link → verify CategoryProduct page loads with the correct products for that category
- Also tests navigation via the dropdown "All Categories" link

**Story 5: Admin Dashboard Access Control (`tests/ui/admin-access-control.spec.js`)**
- End-to-end flow: verifies admin-only pages are accessible to admin users, redirect regular users, and redirect unauthenticated users to login

**Supporting files:**
- `playwright.config.js` — Playwright config (Chromium, sequential, webServer for backend + frontend)
- `tests/ui/global-setup.js` — Global setup: seeds test admin and regular user via test API before all tests
- `routes/testRoutes.js` — Test-only Express routes for seeding users (guarded against production)
- Added `test:ui`, `test:ui:headed`, `test:ui:debug` scripts to `package.json`

### 7.2 Ong Xin Hui Lynnette (A0257058X)

All Milestone 2 work below was done with the assistance of AI.

### 7.2.1 UI testing (Playwright, black-box)

**File:** `tests/ui/ms2-user-auth-e2e.spec.js` (five end-to-end user journeys). Helpers: `tests/ui/helpers/ms2UserUiHelpers.js`.

| Rubric story | Playwright `test.describe` | What the user does (black-box) |
|--------------|----------------------------|--------------------------------|
| Story 1 — Successful registration | `Story 1: Successful User Registration` | Open `/register`, submit a unique new account, see success toast, land on `/login` with login form visible |
| Story 2 — Login + dashboard | `Story 2: Successful Login and Dashboard Access` | Log in with seeded user, open Dashboard from header, see personal details in dashboard card |
| Story 3 — Profile management | `Story 3: Profile Management for Authenticated User` | Log in → sidebar **Profile** → check prefilled fields → update name/phone/address → success toast → values stay after reload |
| Story 4 — Unauthorized routes | `Story 4: Unauthorized Access Blocking for Protected Routes` | As guest, hit `/dashboard/user` and `/dashboard/user/profile`; see countdown redirect UI, no protected content, end on home with **All Products** |
| Story 5 — In-dashboard navigation | `Story 5: User Navigation Within Protected Dashboard` | Log in → dashboard → **Profile** → **Orders** → **Profile** again; account menu still shows Logout (session kept) |

Seeded credentials come from `tests/ui/global-setup.js` (`POST /api/v1/test/setup-user`); password for that user is `Test@12345` (same as existing admin/user seed helpers).

**Run:** `npm run test:ui` (all UI specs) or `npx playwright test tests/ui/ms2-user-auth-e2e.spec.js` (this file only). **Per story:** `npx playwright test tests/ui/ms2-user-auth-e2e.spec.js -g "Story N"` (replace N with 1–5).


### 7.2.2 Frontend integration tests (Jest + React Testing Library, white-box, bottom-up partial integration)

Approach: integrate **real** `AuthProvider` / `CartProvider` / `SearchProvider`, **real** `MemoryRouter` + nested routes, **real** `Layout` / `Header` / `Footer` / `UserMenu` / `Spinner` / `PrivateRoute` where relevant; mock only **external boundaries** (`axios`, `react-hot-toast`, `useCategory`, `matchMedia`).

**1. Registration workflow — `Register.integration.test.js` (6 tests) — Story 1**
- **Tested:** full form in integrated layout (1), complete `POST /api/v1/auth/register` payload (1), success toast + navigation to `/login` (1), server `success: false` error toast (1), generic toast on network failure (1), no navigation on failure (1)
- **Key Features:** end-to-end form → API contract → toast → router; failure keeps user on register
- **Mocking:** axios, react-hot-toast, `useCategory`
- **Style:** Output-based (form chrome), Communication-based (API, toast, navigation)

**2. Login flow — `Login.integration.test.js` (9 tests) — Story 2**
- **Tested:** credentials sent to `POST /api/v1/auth/login` (1), success toast (1), **real** `AuthProvider` sync of `axios.defaults.headers.common.Authorization` (1), **real** `localStorage` persistence of `{ user, token }` (1), navigate to home on success (1), failed login does not touch `localStorage` or Authorization header (2), generic error on thrown API (1), remain on login after failure (1)
- **Key Features:** validates context + storage + header wiring beyond isolated `useAuth` mocks
- **Mocking:** axios, react-hot-toast, `useCategory`
- **Style:** State-based (auth header, storage), Communication-based (API, toast, navigation)

**3. Route protection — `Private.integration.test.js` (6 tests) — Story 3**
- **Tested:** protected outlet when token + `user-auth` returns `ok: true` (1), `GET /api/v1/auth/user-auth` called when token present (1), spinner when unauthenticated (1), no backend call when token missing (1), spinner when `ok: false` (1), protected content gated until async auth resolves (1)
- **Key Features:** **real** `Spinner` + **real** `AuthProvider` (localStorage hydration) + **real** `PrivateRoute`
- **Mocking:** axios, toast, cart/search contexts, `useCategory`
- **Style:** State-based (spinner vs outlet), Communication-based (user-auth call)

**4. Protected dashboard — `Dashboard.integration.test.js` (7 tests) — Story 4**
- **Tested:** dashboard renders under `PrivateRoute` when authorized (1), user name/email/address from **real** auth context in dashboard card (1), `UserMenu` Profile + Orders links and `href`s (1), in-app navigation to profile/orders routes (2), spinner + no dashboard for unauthenticated users (1), block when user-auth fails (1)
- **Key Features:** integrates **real** routing hierarchy (guard + nested dashboard + menu), assertions scoped to dashboard `.card` to avoid header text collisions
- **Mocking:** axios, toast, `useCategory`
- **Style:** Output-based + Communication-based (navigation, authorization)

---

#### Backend integration tests (non-HTTP and HTTP), production fixes, and app wiring

**5. Auth controller integration — `controllers/authController.integration.test.js` (10 tests)**
- **registerController (5):** real `bcrypt` hashing before save, all fields passed to model, validation before hash/save, duplicate email skips hashing, 500 on save throw
- **loginController (5):** real `bcrypt.compare`, JWT from `jsonwebtoken` verifiable with secret, password omitted from response body, wrong password / missing user / missing fields rejected
- **Key Features:** real crypto + JWT; **`userModel` mocked** to keep DB out of this layer
- **Mocking:** `userModel` (constructor / `findOne` / `save`), `req` / `res`
- **Style:** Communication-based (model + bcrypt + JWT), State-based (status + JSON bodies)

**6. Auth middleware integration — `middlewares/authMiddleware.integration.test.js` (6 tests)**
- **Tested:** `requireSignIn` calls `next` and sets `req.user` for valid real JWT (1), 401 + no `next` for invalid/tampered token (1), wrong signing secret (1), expired token (1), missing `Authorization` (1), `req.user` shape / user id extraction (1)
- **Key Features:** exercises **real** `jsonwebtoken.verify` + **real** `requireSignIn` implementation
- **Mocking:** `req` / `res` / `next` only
- **Style:** Communication-based (`next`, response), State-based (401 JSON)

**7. Auth routes — Supertest + real MongoDB — `tests/integration/authRoutes.supertest.integration.test.js` (16 tests)**
- **register (5):** missing field errors, `201` + response shape, bcrypt hash persisted (not plaintext), duplicate email against real data
- **login (5):** success against persisted user, JWT verifiable with `JWT_SECRET`, wrong password / missing user / missing credentials
- **user-auth (6):** access with raw JWT and with `Bearer <token>`, 401 for missing header, malformed JWT, expired JWT, wrong secret
- **Approach:** full HTTP stack via Supertest; **no** `userModel` mock; uses helper below for connect / teardown / collection cleanup
- **Mocking:** none at persistence layer
- **Style:** End-to-end API contract + persistence

**8. Mongo helper for Supertest — `tests/helpers/integrationMongo.js`**
- Connects using `MONGO_URL_TEST` or `MONGO_URL`, targets dedicated integration DB name (`cs4218_ecom_integration_test`), exports `connectIntegrationMongo`, `disconnectIntegrationMongo`, `clearUsersCollection` for deterministic tests

**9. Express app extraction — `app.js` + `server.js`**
- **`app.js`:** exported Express app (middleware + mounted auth/category/product routes + `/`); **no** `listen`, **no** DB connect — usable by Supertest and production `server.js`
- **`server.js`:** imports `app`, runs `connectDB`, calls `listen`
- **Supporting:** `supertest` dev dependency, `npm run test:integration` (see shared Jest config below)

**10. Production fixes aligned with tests — `middlewares/authMiddleware.js`, `client/src/components/Routes/Private.js`**
- **`requireSignIn`:** consistent **401** JSON for missing/invalid JWT; strips optional `Bearer ` prefix so clients and tests can send either form
- **`PrivateRoute`:** `try/catch` around `user-auth` axios call so HTTP failures (e.g. 401) set blocked state and show **real** `Spinner` instead of leaving UI stuck

**11. MS1 unit suites, MS2-aligned updates (not new integration files)**
- **`Login.test.js` / `Register.test.js`:** refactored/split former single success-path test into separate cases (API payload, toast, auth context, `localStorage`, navigation) to mirror integration scenarios while keeping mocked `useAuth`
- **`Private.test.js`:** added spinner case when `axios.get` rejects (e.g. 401)
- **`authMiddleware.test.js`:** expectations updated for 401 responses and Bearer handling; complements `authMiddleware.integration.test.js` and Supertest `user-auth` tests

**12. Shared Jest integration config — `jest.integration.config.js`**
- **With Ivan:** base `testMatch` for `tests/integration/*.test.js` (e.g. category API tests, `mongodb-memory-server`)
- **Added:** `projects` for **`frontend-integration`** (`client/src/**/*.integration.test.js`, jsdom + Babel) and **`backend-integration`** (`controllers/*.integration.test.js`, `middlewares/*.integration.test.js`, `*.supertest.integration.test.js`, node environment)
- **Run:** `npm run test:integration` — Supertest auth suite needs valid Mongo URI in `.env` / `.env.example` (`MONGO_URL` or `MONGO_URL_TEST`)

### 7.3 Koo Zhuo Hui (A0253417H)
### 7.3.1 UI Testing
| Rubric story | Playwright `test.describe` | What the user does (black-box) |
|--------------|----------------------------|--------------------------------|
| E2E Payment (Logged In), User Search   | searchToCheckout.spec.js | Authenticated user searches for a product, adds products to cart, and navigates to cart, and makes payment |
| Failed Payment | negativeTestPayment.spec.js | Unauthenticated user adds a product, and attempts to checkout. Logs in and provides invalid payment credentials, get prompted with invalid card details |
| Failed Search, No Related Products | searchNoResults.spec.js | Users searches for an invalid product, and gets prompted to 'No Resuls Found'. Test scenario includes page rendering product(s) with no related products |
| Product Details | searchProductDetails.spec.js | User navigates to the product details page of a product. And clicks on 'More Details' of a product, and clicks 'Add to Cart' from the Product Details page. Followed by removal of items in the Checkout page |

### 7.3.2 Ingration Testing
## Overview

A bottom-up integration testing strategy was adopted across three test files, covering both
backend (Node.js/Express) and frontend (React) layers. External dependencies such as the
Braintree gateway, Mongoose models, Axios, and React Router were mocked at the outermost
boundary, while all internal component interactions were tested with real implementations.

Test cases were derived using Equivalence Partitioning (EP), Boundary Value Analysis (BVA),
State-based testing, and Communication-based testing (mock verification)

## Test Files

### 1. `braintreeIntegration.test.js` - Backend (20 tests)
Tests `braintreeTokenController` and `brainTreePaymentController` against mocked Braintree
gateway and actual `orderModel`.

| Describe Block | Tests | Techniques |
|---|---|---|
| Token generation | 3 | State-based |
| Input validation (nonce, cart) | 7 | EP, BVA |
| Cart total calculation | 4 | BVA |
| Gateway & OrderModel integration | 5 | Communication-based, State-based |
| Payment gateway options | 1 | Communication-based |

### 2. `productDetailsIntegration.test.js` - Frontend (29 tests)
Bottom-up across 5 layers: `CartContext` → `useParams`/Axios → chained API (getProducts/getRelatedProducts)→ related
products rendering → `CartContext` write-back.

| Describe Block | Tests | Techniques |
|---|---|---|
| `getProduct` API call & product field rendering | 10 | EP, State-based, Communication-based |
| Chained `getProduct` → `getSimilarProduct` | 3 | Communication-based, State-based |
| Related products count (BVA: 0, 1, 2) | 3 | BVA |
| Related product card fields & navigation | 5 | State-based, Communication-based |
| Description truncation at 60 chars (BVA) | 3 | BVA |
| ADD TO CART ↔ CartContext | 5 | State-based, Communication-based |

### 3. `searchIntegration.test.js` - Frontend (31 tests)
Bottom-up across 5 layers: `SearchContext` → `SearchInput`+context → `Search` page+context
→ `CartContext`. 

  &nbsp;&nbsp;&nbsp;&nbsp; 3.1 SearchContext & SearchInput Integration (13 tests)
  
  Tested the search input with edge cases like empty keywords,alphanumeric keytwords, special chars. Applied BVA techniques to test API calls, tested the success
and failure of API calls, and the return of the result(s) of getProduct API.

  &nbsp;&nbsp;&nbsp;&nbsp;  3.2 Search Context & Search Page Integration (11 tests)

For Search page, tests were generated using EP technique
to verify product description is truncated properly, and product fields such as name, price, and image was rendered from the API result. Test if page correct renders the number of products found at various levels (0/1/>1).

  &nbsp;&nbsp;&nbsp;&nbsp; 3.3 Full Pipeline: SearchInput → API → SearchContext → Search (4 tests)

  Tested all 3 components in totality, which included successful and unsuccessful searching of products, API call errors and handling.

  &nbsp;&nbsp;&nbsp;&nbsp; 3.4 Search Page ↔ CartContext (4 tests)

Verified functionality of 'Add To Cart' in the Search page to properly verify functionality across the CartContext, which includes correct addition of products to the context itself, and localStorage.
For example, add 1 item to initially empty cart, add 1 item to existing cart, and add 2 differnt items to cart etc. Other tests includes accurate page navigation to the product site when enters a search.




