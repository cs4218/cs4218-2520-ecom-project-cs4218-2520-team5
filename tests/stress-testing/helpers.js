// Alyssa Ong, A0264663X
// Shared helper functions for k6 stress tests (combined final version)
// Assisted by AI
//
// This file merges helpers from both the arrival-rate stress tests and the
// component-level stress tests into a single comprehensive helper module.

import http from "k6/http";
import { check } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

// ── Base URL (override via K6_BASE_URL env var) ──────────────────────────────
export const BASE_URL = __ENV.K6_BASE_URL || "http://localhost:6060";

// ── Request timeout ──────────────────────────────────────────────────────────
// Requests exceeding this timeout are aborted and counted as failures.
// Phase 1: default 5s — makes degradation visible as errors (realistic user patience).
// Phase 2: run with K6_TIMEOUT=30s to capture true unclipped latency beyond 5s.
export const TIMEOUT = __ENV.K6_TIMEOUT || "5s";

// ── SLA threshold (5s user-patience gate) ────────────────────────────────────
// Regardless of the actual TIMEOUT, requests exceeding this are flagged as
// SLA breaches. This gives dual-metric recording:
//   - Trend metrics (*_duration): true latency (unclipped when TIMEOUT > 5s)
//   - Rate metric (sla_breach_rate): % of requests exceeding the 5s threshold
export const SLA_THRESHOLD_MS = 5000;

// ── Custom metrics per endpoint ──────────────────────────────────────────────
// Trend metrics track latency distributions; Rate metrics track failure rates.
// These are organised by bottleneck category for analysis.
export const metrics = {
  // === CPU-bound auth operations ===
  register:        new Trend("register_duration", true),
  login:           new Trend("login_duration", true),
  forgotPassword:  new Trend("forgot_password_duration", true),
  userAuth:        new Trend("user_auth_duration", true),
  adminAuth:       new Trend("admin_auth_duration", true),
  updateProfile:   new Trend("update_profile_duration", true),

  // === Heavy DB read operations ===
  getProducts:     new Trend("get_products_duration", true),
  singleProduct:   new Trend("single_product_duration", true),
  searchProducts:  new Trend("search_products_duration", true),
  relatedProducts: new Trend("related_products_duration", true),
  getOrders:       new Trend("get_orders_duration", true),
  allOrders:       new Trend("all_orders_duration", true),

  // === Light DB read operations ===
  getCategories:   new Trend("get_categories_duration", true),
  singleCategory:  new Trend("single_category_duration", true),
  productCount:    new Trend("product_count_duration", true),
  productList:     new Trend("product_list_duration", true),
  productCategory: new Trend("product_category_duration", true),

  // === Write operations ===
  createCategory:  new Trend("create_category_duration", true),
  updateCategory:  new Trend("update_category_duration", true),
  deleteCategory:  new Trend("delete_category_duration", true),
  productFilters:  new Trend("product_filters_duration", true),
  orderStatus:     new Trend("order_status_duration", true),

  // === Aggregate failure tracking ===
  failRate:        new Rate("failed_requests"),
  errorCount:      new Counter("error_count"),

  // === SLA breach tracking (dual-metric recording) ===
  // Tracks % of requests exceeding the 5s user-patience threshold.
  // When TIMEOUT is raised (e.g., K6_TIMEOUT=30s), the *_duration Trend
  // metrics show true unclipped latency, while this Rate gives pass/fail.
  slaBreach:       new Rate("sla_breach_rate"),
};

// ── Header helpers ───────────────────────────────────────────────────────────
export function authHeader(token) {
  return { headers: { "Content-Type": "application/json", Authorization: token }, timeout: TIMEOUT };
}

export function authHeaders(token) {
  return { "Content-Type": "application/json", Authorization: token };
}

export function jsonHeader() {
  return { headers: { "Content-Type": "application/json" }, timeout: TIMEOUT };
}

// ── Setup: seed test data and return tokens ──────────────────────────────────
// Creates admin + regular user via test helper routes, seeds a category,
// and fetches existing data for use in tests.
export function seedTestData() {
  const headers = { "Content-Type": "application/json" };

  // 1. Create admin via test helper route
  const adminRes = http.post(
    `${BASE_URL}/api/v1/test/setup-admin`,
    JSON.stringify({
      email: "stress.admin@test.com",
      password: "StressTest@123",
      name: "Stress Admin",
    }),
    { headers }
  );
  let adminToken = null;
  try { adminToken = adminRes.json().token; } catch (_) {}

  // 2. Create regular user via test helper route
  const userRes = http.post(
    `${BASE_URL}/api/v1/test/setup-user`,
    JSON.stringify({
      email: "stress.user@test.com",
      password: "StressTest@123",
      name: "Stress User",
    }),
    { headers }
  );
  let userToken = null;
  try { userToken = userRes.json().token; } catch (_) {}

  // 3. Create a test category (admin-only)
  let categorySlug = "";
  if (adminToken) {
    const catRes = http.post(
      `${BASE_URL}/api/v1/category/create-category`,
      JSON.stringify({ name: `StressCat-${Date.now()}` }),
      authHeader(adminToken)
    );
    try {
      const catData = catRes.json();
      if (catData.category) categorySlug = catData.category.slug;
    } catch (_) {}
  }

  // 4. Fetch existing categories
  const catsRes = http.get(`${BASE_URL}/api/v1/category/get-category`);
  let categories = [];
  let categoryIds = [];
  try {
    const cats = catsRes.json();
    if (cats.category) {
      categories = cats.category;
      categoryIds = cats.category.map((c) => c._id);
    }
  } catch (_) {}

  // 5. Fetch existing products
  const prodsRes = http.get(`${BASE_URL}/api/v1/product/get-product`);
  let products = [];
  try {
    const prods = prodsRes.json();
    if (prods.products) products = prods.products;
  } catch (_) {}

  // 6. Fetch existing orders (admin)
  let orderIds = [];
  if (adminToken) {
    const ordersRes = http.get(`${BASE_URL}/api/v1/auth/all-orders`, {
      headers: authHeaders(adminToken),
    });
    try {
      const orders = ordersRes.json().orders || [];
      orderIds = orders.map((o) => o._id);
    } catch (_) {}
  }

  return {
    adminToken,
    userToken,
    categorySlug,
    categoryIds,
    categories,
    products,
    orderIds,
    userEmail: "stress.user@test.com",
    userPassword: "StressTest@123",
  };
}

// ── Standalone request functions (for combined weighted selection) ────────────
// Each function makes a single HTTP call, records metrics, and returns the response.

export function reqGetProducts() {
  const res = http.get(`${BASE_URL}/api/v1/product/get-product`, { timeout: TIMEOUT });
  metrics.getProducts.add(res.timings.duration);
  metrics.failRate.add(res.status !== 200);
  metrics.slaBreach.add(res.timings.duration > SLA_THRESHOLD_MS);
  check(res, { "get-products 200": (r) => r.status === 200 });
  return res;
}

export function reqGetCategories() {
  const res = http.get(`${BASE_URL}/api/v1/category/get-category`, { timeout: TIMEOUT });
  metrics.getCategories.add(res.timings.duration);
  metrics.failRate.add(res.status !== 200);
  metrics.slaBreach.add(res.timings.duration > SLA_THRESHOLD_MS);
  check(res, { "get-categories 200": (r) => r.status === 200 });
  return res;
}

export function reqSearchProducts() {
  const keywords = ["phone", "laptop", "book", "shirt", "test", "electronics", "battery", "premium"];
  const kw = keywords[Math.floor(Math.random() * keywords.length)];
  const res = http.get(`${BASE_URL}/api/v1/product/search/${kw}`, { timeout: TIMEOUT });
  metrics.searchProducts.add(res.timings.duration);
  metrics.failRate.add(res.status !== 200);
  metrics.slaBreach.add(res.timings.duration > SLA_THRESHOLD_MS);
  check(res, { "search-products 200": (r) => r.status === 200 });
  return res;
}

export function reqGetProductCount() {
  const res = http.get(`${BASE_URL}/api/v1/product/product-count`, { timeout: TIMEOUT });
  metrics.productCount.add(res.timings.duration);
  metrics.failRate.add(res.status !== 200);
  metrics.slaBreach.add(res.timings.duration > SLA_THRESHOLD_MS);
  check(res, { "product-count 200": (r) => r.status === 200 });
  return res;
}

export function reqGetProductList() {
  const page = Math.floor(Math.random() * 3) + 1;
  const res = http.get(`${BASE_URL}/api/v1/product/product-list/${page}`, { timeout: TIMEOUT });
  metrics.productList.add(res.timings.duration);
  metrics.failRate.add(res.status !== 200);
  metrics.slaBreach.add(res.timings.duration > SLA_THRESHOLD_MS);
  check(res, { "product-list 200": (r) => r.status === 200 });
  return res;
}

export function reqLoginUser(data) {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: data.userEmail, password: data.userPassword }),
    jsonHeader()
  );
  metrics.login.add(res.timings.duration);
  metrics.failRate.add(res.status !== 200);
  metrics.slaBreach.add(res.timings.duration > SLA_THRESHOLD_MS);
  check(res, { "login 200": (r) => r.status === 200 });
  return res;
}

export function reqValidateUserAuth(data) {
  const res = http.get(
    `${BASE_URL}/api/v1/auth/user-auth`,
    authHeader(data.userToken)
  );
  metrics.userAuth.add(res.timings.duration);
  metrics.failRate.add(res.status !== 200);
  metrics.slaBreach.add(res.timings.duration > SLA_THRESHOLD_MS);
  check(res, { "user-auth 200": (r) => r.status === 200 });
  return res;
}

export function reqGetOrders(data) {
  const res = http.get(
    `${BASE_URL}/api/v1/auth/orders`,
    authHeader(data.userToken)
  );
  metrics.getOrders.add(res.timings.duration);
  metrics.failRate.add(res.status !== 200);
  metrics.slaBreach.add(res.timings.duration > SLA_THRESHOLD_MS);
  check(res, { "get-orders 200": (r) => r.status === 200 });
  return res;
}

export function reqUpdateProfile(data) {
  const res = http.put(
    `${BASE_URL}/api/v1/auth/profile`,
    JSON.stringify({ name: `StressUser-${Date.now()}` }),
    authHeader(data.userToken)
  );
  metrics.updateProfile.add(res.timings.duration);
  metrics.failRate.add(res.status !== 200);
  metrics.slaBreach.add(res.timings.duration > SLA_THRESHOLD_MS);
  check(res, { "update-profile 200": (r) => r.status === 200 });
  return res;
}

export function reqCreateCategory(data) {
  const res = http.post(
    `${BASE_URL}/api/v1/category/create-category`,
    JSON.stringify({ name: `Cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }),
    authHeader(data.adminToken)
  );
  metrics.createCategory.add(res.timings.duration);
  metrics.failRate.add(res.status !== 201 && res.status !== 200);
  metrics.slaBreach.add(res.timings.duration > SLA_THRESHOLD_MS);
  check(res, { "create-category 2xx": (r) => r.status >= 200 && r.status < 300 });
  return res;
}

export function reqFilterProducts(data) {
  const body = { checked: data.categoryIds.slice(0, 2), radio: [] };
  const res = http.post(
    `${BASE_URL}/api/v1/product/product-filters`,
    JSON.stringify(body),
    jsonHeader()
  );
  metrics.productFilters.add(res.timings.duration);
  metrics.failRate.add(res.status !== 200);
  metrics.slaBreach.add(res.timings.duration > SLA_THRESHOLD_MS);
  check(res, { "product-filters 200": (r) => r.status === 200 });
  return res;
}

// ── Weighted random endpoint selection (for combined tests) ──────────────────
// Weights simulate a realistic e-commerce browsing session:
//   - Heavy DB reads (35%): populate joins & regex scans
//   - CPU-bound auth (20%): bcrypt blocks event loop
//   - Light DB reads (30%): baseline comparison endpoints
//   - Write operations (15%): write contention
const ENDPOINT_WEIGHTS = [
  // Heavy DB reads (35%)
  { fn: reqGetProducts,      weight: 12 },
  { fn: reqSearchProducts,   weight: 12 },
  { fn: reqGetOrders,        weight: 11 },
  // CPU-bound auth (20%)
  { fn: reqLoginUser,        weight: 12 },
  { fn: reqUpdateProfile,    weight: 8 },
  // Light DB reads (30%)
  { fn: reqGetCategories,    weight: 10 },
  { fn: reqGetProductCount,  weight: 5 },
  { fn: reqGetProductList,   weight: 10 },
  { fn: reqValidateUserAuth, weight: 5 },
  // Write operations (15%)
  { fn: reqCreateCategory,   weight: 7 },
  { fn: reqFilterProducts,   weight: 8 },
];

const TOTAL_WEIGHT = ENDPOINT_WEIGHTS.reduce((sum, e) => sum + e.weight, 0);

export function pickRandomEndpoint() {
  let rand = Math.random() * TOTAL_WEIGHT;
  for (const entry of ENDPOINT_WEIGHTS) {
    rand -= entry.weight;
    if (rand <= 0) return entry.fn;
  }
  return ENDPOINT_WEIGHTS[0].fn;
}

// ── Search keywords (shared across tests) ────────────────────────────────────
export const SEARCH_KEYWORDS = [
  "phone", "laptop", "book", "shirt", "electronics",
  "battery", "computing", "running shoes", "test", "premium",
];
