import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { authMiddleware } from "../../../middleware/authMiddleware";

export const dynamic = "force-dynamic";

// GET - Ambil semua bouquets
export async function GET(request) {
  try {
    // Load Bouquet model
    const Bouquet = (await import("../../../models/Bouquet")).default;

    // Get query params untuk filter dan pagination
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("is_active");
    const q = searchParams.get("q");
    const sort = searchParams.get("sort") || "newest"; // newest, oldest, price_asc, price_desc
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 9;
    const offset = (page - 1) * limit;

    const where = {};

    // Add active status filter
    if (isActive !== null) {
      where.is_active = isActive === "true";
    }

    // Add search filter
    if (q && q.trim() !== "") {
      const searchTerm = `%${q.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: searchTerm } },
        { description: { [Op.like]: searchTerm } },
      ];
    }

    // Determine sort order
    let order;
    switch (sort) {
      case "oldest":
        order = [["created_at", "ASC"]];
        break;
      case "price_asc":
        order = [["price", "ASC"]];
        break;
      case "price_desc":
        order = [["price", "DESC"]];
        break;
      case "newest":
      default:
        order = [["created_at", "DESC"]];
        break;
    }

    // Get total count for pagination
    const total = await Bouquet.count({ where });

    // Get paginated bouquets with sorting
    const bouquets = await Bouquet.findAll({
      where,
      order,
      limit,
      offset,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: bouquets,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Get bouquets error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST - Tambah bouquet baru
export const POST = authMiddleware(async function POST(request) {
  try {
    const body = await request.json();
    const { name, price, description, image_url, is_active } = body;

    // Validasi
    if (!name || !price) {
      return NextResponse.json(
        { success: false, message: "Name and price are required" },
        { status: 400 }
      );
    }

    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { success: false, message: "Invalid price" },
        { status: 400 }
      );
    }

    // Load Bouquet model
    const Bouquet = (await import("../../../models/Bouquet")).default;

    const bouquet = await Bouquet.create({
      name,
      price,
      description: description || null,
      image_url: image_url || null,
      is_active: is_active !== undefined ? is_active : true,
    });

    return NextResponse.json({
      success: true,
      message: "Bouquet created successfully",
      data: bouquet,
    });
  } catch (error) {
    console.error("Create bouquet error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
});
