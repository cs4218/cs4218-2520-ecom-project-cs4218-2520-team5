import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";
import gateway from "../config/braintree.js";
import fs from "fs";
import slugify from "slugify";

export const createProductController = async (req, res) => {
	try {
		const { name, description, price, category, quantity, shipping } =
			req.fields;
		const { photo } = req.files;
		//validation
		const errors = [];
		if (!name) errors.push("Name is Required");
		if (!description) errors.push("Description is Required");
		if (!price) errors.push("Price is Required");
		if (!category) errors.push("Category is Required");
		if (!quantity) errors.push("Quantity is Required");
		if (photo && photo.size > 1000000)
			errors.push("photo is Required and should be less than 1mb");
		if (errors.length > 0) {
			return res.status(400).send({ success: false, errors });
		}

		const products = new productModel({ ...req.fields, slug: slugify(name) });
		if (photo) {
			products.photo.data = fs.readFileSync(photo.path);
			products.photo.contentType = photo.type;
		}
		await products.save();
		res.status(201).send({
			success: true,
			message: "Product Created Successfully",
			products,
		});
	} catch (error) {
		console.log(error);
		res.status(500).send({
			success: false,
			error,
			message: "Error in creating product",
		});
	}
};

//get all products
export const getProductController = async (req, res) => {
	try {
		const products = await productModel
			.find({})
			.populate("category")
			.select("-photo")
			.limit(12)
			.sort({ createdAt: -1 });
		res.status(200).send({
			success: true,
			countTotal: products.length,
			message: "All Products ",
			products,
		});
	} catch (error) {
		console.log(error);
		res.status(500).send({
			success: false,
			message: "Error in getting products",
			error: error.message,
		});
	}
};
// get single product
export const getSingleProductController = async (req, res) => {
	try {
		const product = await productModel
			.findOne({ slug: req.params.slug })
			.select("-photo")
			.populate("category");
		res.status(200).send({
			success: true,
			message: "Single Product Fetched",
			product,
		});
	} catch (error) {
		console.log(error);
		res.status(500).send({
			success: false,
			message: "Error while getting single product",
			error,
		});
	}
};

// get photo
export const productPhotoController = async (req, res) => {
	try {
		const product = await productModel.findById(req.params.pid).select("photo");
		if (!product) {
			return res.status(404).send({
				success: false,
				message: "Product not found",
			});
		}
		if (product.photo.data) {
			res.set("Content-type", product.photo.contentType);
			return res.status(200).send(product.photo.data);
		}
	} catch (error) {
		console.log(error);
		res.status(500).send({
			success: false,
			message: "Error while getting photo",
			error,
		});
	}
};

//delete controller
export const deleteProductController = async (req, res) => {
	try {
		await productModel.findByIdAndDelete(req.params.pid).select("-photo");
		res.status(200).send({
			success: true,
			message: "Product Deleted successfully",
		});
	} catch (error) {
		console.log(error);
		res.status(500).send({
			success: false,
			message: "Error while deleting product",
			error,
		});
	}
};

//upate producta
export const updateProductController = async (req, res) => {
	try {
		const { name, description, price, category, quantity, shipping } =
			req.fields;
		const { photo } = req.files;
		//validation
		const errors = [];
		if (!name) errors.push("Name is Required");
		if (!description) errors.push("Description is Required");
		if (!price) errors.push("Price is Required");
		if (!category) errors.push("Category is Required");
		if (!quantity) errors.push("Quantity is Required");
		if (photo && photo.size > 1000000)
			errors.push("photo is Required and should be less than 1mb");
		if (errors.length > 0) {
			return res.status(400).send({ success: false, errors });
		}

		const products = await productModel.findByIdAndUpdate(
			req.params.pid,
			{ ...req.fields, slug: slugify(name) },
			{ new: true },
		);
		if (photo) {
			products.photo.data = fs.readFileSync(photo.path);
			products.photo.contentType = photo.type;
		}
		await products.save();
		res.status(201).send({
			success: true,
			message: "Product Updated Successfully",
			products,
		});
	} catch (error) {
		console.log(error);
		res.status(500).send({
			success: false,
			error,
			message: "Error in Update product",
		});
	}
};

// filters
export const productFiltersController = async (req, res) => {
	try {
		const { checked, radio } = req.body;
		let args = {};
		if (checked.length > 0) args.category = checked;
		if (radio.length) {
			args.$or = radio.map(([min, max]) => ({
				price: { $gte: min, $lte: max },
			}));
		}
		const products = await productModel.find(args);
		res.status(200).send({
			success: true,
			products,
		});
	} catch (error) {
		console.log(error);
		res.status(400).send({
			success: false,
			message: "Error WHile Filtering Products",
			error,
		});
	}
};

// product count
export const productCountController = async (req, res) => {
	try {
		const total = await productModel.find({}).estimatedDocumentCount();
		res.status(200).send({
			success: true,
			total,
		});
	} catch (error) {
		console.log(error);
		res.status(400).send({
			message: "Error in product count",
			error,
			success: false,
		});
	}
};

// product list base on page
export const productListController = async (req, res) => {
	try {
		const perPage = 6;
		const page = req.params.page ? req.params.page : 1;
		const products = await productModel
			.find({})
			.select("-photo")
			.skip((page - 1) * perPage)
			.limit(perPage)
			.sort({ createdAt: -1 });
		res.status(200).send({
			success: true,
			products,
		});
	} catch (error) {
		console.log(error);
		res.status(400).send({
			success: false,
			message: "error in per page ctrl",
			error,
		});
	}
};

// search product
export const searchProductController = async (req, res) => {
	try {
		const { keyword } = req.params;

		// Generate plural/singular/verb-form variations for each word
		const generateVariations = (word) => {
			const variations = new Set([word]);
			const w = word.toLowerCase();

			// Plural -> singular
			if (w.endsWith("ies") && w.length > 3) {
				variations.add(w.slice(0, -3) + "y"); // batteries -> battery
			} else if (w.endsWith("es") && w.length > 3) {
				variations.add(w.slice(0, -2)); // boxes -> box
			} else if (w.endsWith("s") && w.length > 2) {
				variations.add(w.slice(0, -1)); // books -> book
			}

			// Singular -> plural
			if (
				w.endsWith("y") &&
				w.length > 2 &&
				!"aeiou".includes(w[w.length - 2])
			) {
				variations.add(w.slice(0, -1) + "ies"); // battery -> batteries
			} else if (!w.endsWith("s")) {
				variations.add(w + "s"); // book -> books
			}

			// Verb forms
			if (w.endsWith("ing") && w.length > 4) {
				variations.add(w.slice(0, -3)); // running -> runn
				variations.add(w.slice(0, -3) + "e"); // computing -> compute
			}
			if (w.endsWith("ed") && w.length > 3) {
				variations.add(w.slice(0, -2)); // walked -> walk
				variations.add(w.slice(0, -1)); // baked -> bake
			}

			return [...variations];
		};

		// Split into individual words and collect all variations
		const words = keyword.trim().split(/\s+/);
		const allPatterns = new Set([keyword]); // always include full phrase
		words.forEach((word) =>
			generateVariations(word).forEach((v) => allPatterns.add(v)),
		);

		// Build $or conditions across name and description for every pattern
		const searchConditions = [...allPatterns].flatMap((pattern) => [
			{ name: { $regex: pattern, $options: "i" } },
			{ description: { $regex: pattern, $options: "i" } },
		]);

		const results = await productModel
			.find({ $or: searchConditions })
			.select("-photo");
		res.json(results);
	} catch (error) {
		console.log(error);
		res.status(400).send({
			success: false,
			message: "Error In Search Product API",
			error,
		});
	}
};

// similar products
export const realtedProductController = async (req, res) => {
	try {
		const { pid, cid } = req.params;
		const products = await productModel
			.find({
				category: cid,
				_id: { $ne: pid },
			})
			.select("-photo")
			.limit(3)
			.populate("category");
		res.status(200).send({
			success: true,
			products,
		});
	} catch (error) {
		console.log(error);
		res.status(400).send({
			success: false,
			message: "error while geting related product",
			error,
		});
	}
};

// get prdocyst by catgory
export const productCategoryController = async (req, res) => {
	try {
		const category = await categoryModel.findOne({ slug: req.params.slug });
		const products = await productModel.find({ category }).populate("category");
		res.status(200).send({
			success: true,
			category,
			products,
		});
	} catch (error) {
		console.log(error);
		res.status(400).send({
			success: false,
			error,
			message: "Error While Getting products",
		});
	}
};

//payment gateway api
//token
export const braintreeTokenController = async (req, res) => {
	try {
		gateway.clientToken.generate({}, function (err, response) {
			if (err) {
				res.status(500).send(err);
			} else {
				return res.status(200).json(response);
			}
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: "Something went wrong" });
	}
};

//payment
export const brainTreePaymentController = async (req, res) => {
	try {
		const { nonce, cart } = req.body;

		if (!nonce || !cart || cart.length === 0) {
			return res.status(400).json({ error: "Invalid payment data" });
		}
		let total = 0;
		cart.map((i) => {
			total += i.price;
		});

		gateway.transaction.sale(
			{
				amount: total.toFixed(2),
				paymentMethodNonce: nonce,
				options: {
					submitForSettlement: true,
				},
			},
			async (error, result) => {
				try {
					if (error) {
						return res.status(500).json({ error: error.message });
					}

					if (result.success) {
						await new orderModel({
							products: cart,
							payment: result,
							buyer: req.user._id,
						}).save();

						return res.status(200).json({ ok: true });
					} else {
						return res.status(500).json({ error: result.message });
					}
				} catch (err) {
					res.status(500).json({ error: "Save failed" });
				}
			},
		);
	} catch (error) {
		return res.status(500).json({ error: "Payment failed" });
	}
};
