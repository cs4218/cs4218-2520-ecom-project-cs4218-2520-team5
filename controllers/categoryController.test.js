// Ivan Ang, A0259256U
// Assisted by AI
import { jest } from "@jest/globals";

// jest.unstable_mockModule must be called before any imports of the mocked module.
// Dynamic imports (await import(...)) are used after mocking so Jest returns the mocked version.

jest.unstable_mockModule("../models/categoryModel.js", () => {
  const mockCategoryModel = jest.fn().mockImplementation(() => ({
    save: jest.fn(),
  }));
  mockCategoryModel.findOne = jest.fn();
  mockCategoryModel.find = jest.fn();
  mockCategoryModel.findByIdAndUpdate = jest.fn();
  mockCategoryModel.findByIdAndDelete = jest.fn();
  return { default: mockCategoryModel };
});

jest.unstable_mockModule("slugify", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue("mocked-slug"),
}));

const { default: categoryModel } = await import("../models/categoryModel.js");
const { default: slugify } = await import("slugify");
const {
  createCategoryController,
  updateCategoryController,
  categoryController,
  singleCategoryController,
  deleteCategoryController,
} = await import("../controllers/categoryController.js");

// Story 1: createCategoryController
describe("createCategoryController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    slugify.mockReturnValue("mocked-slug");
  });

  it("should return 401 when name is missing", async () => {
    req.body = {};

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
  });

  it("should return 401 when name is an empty string", async () => {
    req.body = { name: "" };

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
  });

  it("should return 200 when the category already exists (duplicate)", async () => {
    req.body = { name: "Electronics" };
    categoryModel.findOne.mockResolvedValueOnce({ _id: "1", name: "Electronics" });

    await createCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Electronics" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category Already Exists",
    });
  });

  it("should return 201 with the new category on successful creation", async () => {
    const savedCategory = { _id: "abc", name: "Electronics", slug: "electronics" };
    req.body = { name: "Electronics" };
    categoryModel.findOne.mockResolvedValueOnce(null);
    slugify.mockReturnValueOnce("electronics");
    const mockSave = jest.fn().mockResolvedValueOnce(savedCategory);
    categoryModel.mockImplementation(() => ({ save: mockSave }));

    await createCategoryController(req, res);

    expect(slugify).toHaveBeenCalledWith("Electronics");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "new category created",
      category: savedCategory,
    });
  });

  it("should return 500 when a database error occurs", async () => {
    req.body = { name: "Electronics" };
    categoryModel.findOne.mockRejectedValueOnce(new Error("DB error"));

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});

// Story 2: updateCategoryController
describe("updateCategoryController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    slugify.mockReturnValue("mocked-slug");
  });

  it("should return 200 with the updated category on success", async () => {
    const updatedCategory = { _id: "1", name: "Updated Name", slug: "updated-name" };
    req.body = { name: "Updated Name" };
    req.params = { id: "1" };
    categoryModel.findByIdAndUpdate.mockResolvedValueOnce(updatedCategory);
    slugify.mockReturnValueOnce("updated-name");

    await updateCategoryController(req, res);

    expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "1",
      { name: "Updated Name", slug: "updated-name" },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category Updated Successfully",
      category: updatedCategory,
    });
  });

  it("should return 404 when the category to update is not found", async () => {
    req.body = { name: "Ghost Category" };
    req.params = { id: "nonexistent" };
    categoryModel.findByIdAndUpdate.mockResolvedValueOnce(null);

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  it("should return 500 on a database error", async () => {
    req.body = { name: "Electronics" };
    req.params = { id: "1" };
    categoryModel.findByIdAndUpdate.mockRejectedValueOnce(new Error("DB error"));

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while updating category",
      })
    );
  });
});

// Story 3: deleteCategoryController
describe("deleteCategoryController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  it("should return 200 on successful deletion", async () => {
    req.params = { id: "1" };
    categoryModel.findByIdAndDelete.mockResolvedValueOnce({ _id: "1", name: "Electronics" });

    await deleteCategoryController(req, res);

    expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category Deleted Successfully",
    });
  });

  it("should return 404 when the category to delete is not found", async () => {
    req.params = { id: "nonexistent" };
    categoryModel.findByIdAndDelete.mockResolvedValueOnce(null);

    await deleteCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  it("should return 500 on a database error", async () => {
    req.params = { id: "1" };
    categoryModel.findByIdAndDelete.mockRejectedValueOnce(new Error("DB error"));

    await deleteCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "error while deleting category",
      })
    );
  });
});

// Story 4: categoryController (get all)
describe("categoryController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  it("should return 200 with all categories", async () => {
    const categories = [
      { _id: "1", name: "Electronics" },
      { _id: "2", name: "Books" },
    ];
    categoryModel.find.mockResolvedValueOnce(categories);

    await categoryController(req, res);

    expect(categoryModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "All Categories List",
      category: categories,
    });
  });

  it("should return 500 on a database error", async () => {
    categoryModel.find.mockRejectedValueOnce(new Error("DB error"));

    await categoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while getting all categories",
      })
    );
  });
});

// Story 5: singleCategoryController
describe("singleCategoryController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  it("should return 200 with the matching category when found", async () => {
    const category = { _id: "1", name: "Electronics", slug: "electronics" };
    req.params = { slug: "electronics" };
    categoryModel.findOne.mockResolvedValueOnce(category);

    await singleCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "electronics" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Get Single Category Successfully",
      category,
    });
  });

  it("should return 404 when the category is not found", async () => {
    req.params = { slug: "nonexistent" };
    categoryModel.findOne.mockResolvedValueOnce(null);

    await singleCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  it("should return 500 on a database error", async () => {
    req.params = { slug: "electronics" };
    categoryModel.findOne.mockRejectedValueOnce(new Error("DB error"));

    await singleCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error While getting Single Category",
      })
    );
  });
});
