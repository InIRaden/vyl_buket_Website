import { NextResponse } from "next/server";
import { Order, Bouquet, OrderImage, sequelize } from "@/models";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// GET - Read all orders (Protected dengan JWT)
export async function GET(request) {
  try {
    // Cek JWT token dari cookie
    const cookieStore = cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Token required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Get query parameters untuk filter
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("payment_status");
    const pickupDateFrom = searchParams.get("pickup_date_from");
    const pickupDateTo = searchParams.get("pickup_date_to");
    const pickupTimeFrom = searchParams.get("pickup_time_from");
    const pickupTimeTo = searchParams.get("pickup_time_to");
    const searchQuery = searchParams.get("q");
    const sort = searchParams.get("sort") || "newest"; // newest, oldest, pickup_nearest, price_asc, price_desc
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (status) {
      whereClause.order_status = status;
    }
    if (paymentStatus) {
      whereClause.payment_status = paymentStatus;
    }

    // Filter tanggal pengambilan (range)
    if (pickupDateFrom || pickupDateTo) {
      whereClause.pickup_date = {};
      if (pickupDateFrom) {
        whereClause.pickup_date[sequelize.Sequelize.Op.gte] = pickupDateFrom;
      }
      if (pickupDateTo) {
        whereClause.pickup_date[sequelize.Sequelize.Op.lte] = pickupDateTo;
      }
    }

    // Filter waktu pengambilan (range)
    if (pickupTimeFrom || pickupTimeTo) {
      whereClause.pickup_time = {};
      if (pickupTimeFrom) {
        whereClause.pickup_time[sequelize.Sequelize.Op.gte] = pickupTimeFrom;
      }
      if (pickupTimeTo) {
        whereClause.pickup_time[sequelize.Sequelize.Op.lte] = pickupTimeTo;
      }
    }

    if (searchQuery) {
      whereClause[sequelize.Sequelize.Op.or] = [
        {
          customer_name: { [sequelize.Sequelize.Op.like]: `%${searchQuery}%` },
        },
        { order_number: { [sequelize.Sequelize.Op.like]: `%${searchQuery}%` } },
      ];
    }

    // Determine sort order
    let orderClause;
    switch (sort) {
      case "oldest":
        orderClause = [["created_at", "ASC"]];
        break;
      case "pickup_nearest":
        orderClause = [
          ["pickup_date", "ASC"],
          ["pickup_time", "ASC"],
        ];
        break;
      case "price_asc":
        orderClause = [["bouquet_price", "ASC"]];
        break;
      case "price_desc":
        orderClause = [["bouquet_price", "DESC"]];
        break;
      case "newest":
      default:
        orderClause = [["created_at", "DESC"]];
        break;
    }

    // Count total for pagination
    const total = await Order.count({ where: whereClause });

    // Fetch orders dengan relasi
    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: Bouquet,
          as: "bouquet",
          attributes: ["id", "name", "price", "image_url", "description"],
        },
        {
          model: OrderImage,
          as: "images",
          attributes: ["id", "image_url", "image_type", "display_order"],
          order: [["display_order", "ASC"]],
        },
      ],
      order: orderClause,
      limit,
      offset,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("GET Orders error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new order (Public - untuk customer)
export async function POST(request) {
  const transaction = await sequelize.transaction();

  try {
    const body = await request.json();

    // Validasi input required
    const requiredFields = [
      "customer_name",
      "quantity",
      "bouquet_id",
      "pickup_date",
      "pickup_time",
      "payment_type",
      "sender_name",
      "payment_method",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        await transaction.rollback();
        return NextResponse.json(
          { success: false, message: `Field ${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validasi tanggal pickup tidak boleh kemarin
    const pickupDate = new Date(body.pickup_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    pickupDate.setHours(0, 0, 0, 0);

    if (pickupDate < today) {
      await transaction.rollback();
      return NextResponse.json(
        {
          success: false,
          message: "Tanggal pengambilan tidak boleh di masa lalu",
        },
        { status: 400 }
      );
    }

    // Validasi waktu pickup (jam operasional 08:00 - 18:00)
    const pickupTime = body.pickup_time;
    const [pickupHour, pickupMinute] = pickupTime.split(":").map(Number);

    if (
      pickupHour < 8 ||
      pickupHour > 18 ||
      (pickupHour === 18 && pickupMinute > 0)
    ) {
      await transaction.rollback();
      return NextResponse.json(
        {
          success: false,
          message: "Jam pengambilan harus antara 08:00 - 18:00 WIB",
        },
        { status: 400 }
      );
    }

    // Validasi jika hari ini, harus minimal 1 jam ke depan
    const isToday = pickupDate.getTime() === today.getTime();
    if (isToday) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Calculate minimum allowed time (current + 1 hour)
      const minHour = currentHour + 1;

      if (minHour >= 18) {
        await transaction.rollback();
        return NextResponse.json(
          {
            success: false,
            message:
              "Waktu operasional hari ini sudah habis. Silakan pilih tanggal besok.",
          },
          { status: 400 }
        );
      }

      if (
        pickupHour < minHour ||
        (pickupHour === minHour && pickupMinute < currentMinute)
      ) {
        await transaction.rollback();
        return NextResponse.json(
          {
            success: false,
            message: `Waktu pengambilan harus minimal 1 jam dari sekarang (minimal ${String(
              minHour
            ).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")})`,
          },
          { status: 400 }
        );
      }
    }

    // Cek bouquet exists
    const bouquet = await Bouquet.findByPk(body.bouquet_id);
    if (!bouquet) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: "Bouquet not found" },
        { status: 404 }
      );
    }

    if (!bouquet.is_active) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: "Bouquet is not available" },
        { status: 400 }
      );
    }

    // Generate order number (format: ORD-YYYYMMDD-XXXX)
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const count = await Order.count({
      where: sequelize.where(
        sequelize.fn("DATE", sequelize.col("created_at")),
        now.toISOString().slice(0, 10)
      ),
    });
    const orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    // Hitung payment
    const quantity = parseInt(body.quantity) || 1;
    const bouquetPrice = parseFloat(bouquet.price) * quantity;
    let dpAmount = 0;
    let remainingAmount = 0;
    let totalPaid = 0;
    let paymentStatus = "UNPAID";

    if (body.payment_type === "DP") {
      // DP 30%
      dpAmount = bouquetPrice * 0.3;
      remainingAmount = bouquetPrice - dpAmount;
      totalPaid = dpAmount; // Set total_paid sesuai DP amount
    } else if (body.payment_type === "FULL") {
      dpAmount = 0;
      remainingAmount = 0;
      totalPaid = bouquetPrice; // Set total_paid sesuai full amount
    }

    // Create order
    const order = await Order.create(
      {
        order_number: orderNumber,
        bouquet_id: body.bouquet_id,
        customer_name: body.customer_name,
        quantity: quantity,
        sender_name: body.sender_name,
        sender_account_number: body.sender_account_number || null,
        sender_phone: body.sender_phone || null,
        bouquet_price: bouquetPrice,
        payment_type: body.payment_type,
        payment_method: body.payment_method,
        dp_amount: dpAmount,
        remaining_amount: remainingAmount,
        total_paid: totalPaid,
        pickup_date: body.pickup_date,
        pickup_time: body.pickup_time,
        additional_request: body.additional_request || null,
        card_message: body.card_message || null,
        order_status: "WAITING_CONFIRMATION",
        payment_status: paymentStatus,
        whatsapp_sent: false,
      },
      { transaction }
    );

    // Simpan foto desired bouquet (bisa lebih dari 1)
    if (
      body.desired_bouquet_images &&
      Array.isArray(body.desired_bouquet_images)
    ) {
      for (let i = 0; i < body.desired_bouquet_images.length; i++) {
        await OrderImage.create(
          {
            order_id: order.id,
            image_url: body.desired_bouquet_images[i],
            image_type: "DESIRED_BOUQUET",
            display_order: i + 1,
          },
          { transaction }
        );
      }
    }

    // Simpan foto referensi (bisa lebih dari 1)
    if (body.reference_images && Array.isArray(body.reference_images)) {
      for (let i = 0; i < body.reference_images.length; i++) {
        await OrderImage.create(
          {
            order_id: order.id,
            image_url: body.reference_images[i],
            image_type: "REFERENCE",
            display_order: i + 1,
          },
          { transaction }
        );
      }
    }

    // Simpan bukti transfer (bisa lebih dari 1)
    if (body.payment_proofs && Array.isArray(body.payment_proofs)) {
      for (let i = 0; i < body.payment_proofs.length; i++) {
        await OrderImage.create(
          {
            order_id: order.id,
            image_url: body.payment_proofs[i],
            image_type: "PAYMENT_PROOF",
            display_order: i + 1,
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    // Fetch order lengkap dengan relasi
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: Bouquet,
          as: "bouquet",
          attributes: ["id", "name", "price", "image_url"],
        },
        {
          model: OrderImage,
          as: "images",
          order: [["display_order", "ASC"]],
        },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        data: createdOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    await transaction.rollback();
    console.error("POST Order error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
