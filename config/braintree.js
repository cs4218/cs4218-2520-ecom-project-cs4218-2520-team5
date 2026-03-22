import braintree from "braintree";
import dotenv from "dotenv";

dotenv.config();

const merchantId = process.env.BRAINTREE_MERCHANT_ID;
const publicKey = process.env.BRAINTREE_PUBLIC_KEY;
const privateKey = process.env.BRAINTREE_PRIVATE_KEY;

// Omit gateway when credentials are missing so the API can boot (e.g. local E2E without Braintree).
const gateway =
	merchantId && publicKey && privateKey
		? new braintree.BraintreeGateway({
				environment: braintree.Environment.Sandbox,
				merchantId,
				publicKey,
				privateKey,
			})
		: null;

export default gateway;
