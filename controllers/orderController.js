import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import { hashPassword } from "./../helpers/authHelper.js";

//update profile
export const updateProfileController = async (req, res) => {
  try {
    // Check if user ID exists
    if (!req.user || !req.user._id) {
      return res.status(401).send({
        success: false,
        message: "User ID not found in request",
      });
    }

    const { name, password, address, phone } = req.body;

    const user = await userModel.findById(req.user._id);

    // Check if user exists
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    // Validate empty strings
    if (name === "") {
      return res.status(400).send({ error: "Name cannot be empty" });
    }
    if (phone === "") {
      return res.status(400).send({ error: "Phone cannot be empty" });
    }
    if (address === "") {
      return res.status(400).send({ error: "Address cannot be empty" });
    }

    //password
    if (password && password.length < 6) {
      return res
        .status(400)
        .send({ error: "Password is required and 6 character long" });
    }
    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updatedUser = await userModel
      .findByIdAndUpdate(
        req.user._id,
        {
          name: name || user.name,
          password: hashedPassword || user.password,
          phone: phone || user.phone,
          address: address || user.address,
        },
        { new: true },
      )
      .select("-password");
    res.status(200).send({
      success: true,
      message: "Profile Updated Successfully",
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error while updating profile",
      error,
    });
  }
};

//orders
export const getOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Getting Orders",
      error,
    });
  }
};
//orders
export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: "-1" });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Getting Orders",
      error,
    });
  }
};

//order status
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const orders = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true },
    );
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Updating Order",
      error,
    });
  }
};
