import { NextResponse } from "next/server";
import { Order, Bouquet } from "@/models";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    // Get statistics for each status (count orders)
    const [waiting, confirmed, inProcess, ready, completed] = await Promise.all(
      [
        Order.count({ where: { order_status: "WAITING_CONFIRMATION" } }),
        Order.count({ where: { order_status: "PAYMENT_CONFIRMED" } }),
        Order.count({ where: { order_status: "IN_PROCESS" } }),
        Order.count({ where: { order_status: "READY_FOR_PICKUP" } }),
        Order.count({ where: { order_status: "COMPLETED" } }),
      ]
    );

    // Get total quantity for each status
    const { sequelize } = require("../../../../lib/sequelize");
    const [waitingQty, confirmedQty, inProcessQty, readyQty, completedQty] = await Promise.all(
      [
        Order.sum('quantity', { where: { order_status: "WAITING_CONFIRMATION" } }),
        Order.sum('quantity', { where: { order_status: "PAYMENT_CONFIRMED" } }),
        Order.sum('quantity', { where: { order_status: "IN_PROCESS" } }),
        Order.sum('quantity', { where: { order_status: "READY_FOR_PICKUP" } }),
        Order.sum('quantity', { where: { order_status: "COMPLETED" } }),
      ]
    );

    // Get recent orders (last 10)
    const recentOrders = await Order.findAll({
      limit: 10,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: Bouquet,
          as: "bouquet",
          attributes: ["id", "name", "price"],
        },
      ],
      attributes: [
        "id",
        "order_number",
        "customer_name",
        "quantity",
        "bouquet_id",
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
      waitingQty: waitingQty || 0,
      confirmedQty: confirmedQty || 0,
      inProcessQty: inProcessQty || 0,
      readyQty: readyQty || 0,
      completedQty: completedQty || 0,
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
