import { NextResponse } from "next/server";
import Order from "../../../../models/Order";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    // Get statistics for each status
    const [waiting, confirmed, inProcess, ready, completed] = await Promise.all(
      [
        Order.count({ where: { order_status: "WAITING_CONFIRMATION" } }),
        Order.count({ where: { order_status: "PAYMENT_CONFIRMED" } }),
        Order.count({ where: { order_status: "IN_PROCESS" } }),
        Order.count({ where: { order_status: "READY_FOR_PICKUP" } }),
        Order.count({ where: { order_status: "COMPLETED" } }),
      ]
    );

    // Get recent orders (last 10)
    const recentOrders = await Order.findAll({
      limit: 10,
      order: [["created_at", "DESC"]],
      attributes: [
        "id",
        "customer_name",
        "bouquet_name",
        "custom_bouquet_type",
        "pickup_date",
        "order_status",
        "payment_status",
      ],
    });

    const stats = {
      waiting,
      confirmed,
      inProcess,
      ready,
      completed,
    };

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recentOrders,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
