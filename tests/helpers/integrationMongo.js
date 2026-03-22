// MS2 — MongoDB test DB helpers for Supertest integration
// Written by: Ong Xin Hui Lynnette, A0257058X
// Assisted by AI

/**
 * MongoDB helpers for backend integration tests (Supertest + real persistence).
 *
 * - Uses MONGO_URL_TEST when set (recommended for CI / explicit test cluster DB).
 * - Otherwise derives a dedicated database name on the same cluster as MONGO_URL
 *   so application data in another database name is not touched.
 *
 * Never hardcode credentials; URLs come from environment only.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/** Logical name of the database used only for integration tests */
export const INTEGRATION_TEST_DB_NAME = "cs4218_ecom_integration_test";

/**
 * Resolve the Mongo connection string for integration tests.
 * @throws {Error} if neither MONGO_URL_TEST nor MONGO_URL is set
 */
export function resolveIntegrationTestMongoUrl() {
  const explicit = process.env.MONGO_URL_TEST?.trim();
  if (explicit) {
    return explicit;
  }

  const base = process.env.MONGO_URL?.trim();
  if (!base) {
    throw new Error(
      "Integration tests require MONGO_URL or MONGO_URL_TEST in the environment (e.g. via .env)"
    );
  }

  const [beforeQuery, ...queryParts] = base.split("?");
  const query = queryParts.length ? `?${queryParts.join("?")}` : "";

  const m = beforeQuery.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(\/([^/?]*))?$/);
  if (!m) {
    return `${beforeQuery}/${INTEGRATION_TEST_DB_NAME}${query}`;
  }

  const [, authority] = m;
  return `${authority}/${INTEGRATION_TEST_DB_NAME}${query}`;
}

/**
 * Connect mongoose to the integration-test database only.
 */
export async function connectIntegrationMongo() {
  const uri = resolveIntegrationTestMongoUrl();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);
}

export async function disconnectIntegrationMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

/**
 * Remove all documents from the users collection (Mongoose model name "users").
 */
export async function clearUsersCollection() {
  const coll = mongoose.connection.collection("users");
  await coll.deleteMany({});
}
