import { NextResponse } from "next/server";
import { Order, OrderLog } from "@/models";
import { authMiddleware } from "@/middleware/authMiddleware";

export const dynamic = "force-dynamic";

export const PUT = authMiddleware(async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Find the order
    const order = await Order.findByPk(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    const updates = {};
    const oldStatus = order.order_status;
    const oldPaymentStatus = order.payment_status;

    // Update order status if provided
    if (body.status) {
      const validStatuses = [
        "WAITING_CONFIRMATION",
        "PAYMENT_CONFIRMED",
        "IN_PROCESS",
        "READY_FOR_PICKUP",
        "COMPLETED",
        "CANCELLED",
      ];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, message: "Invalid status" },
          { status: 400 }
        );
      }
      updates.order_status = body.status;
    }

    // Update payment status if provided
    if (body.payment_status) {
      if (!["UNPAID", "PAID"].includes(body.payment_status)) {
        return NextResponse.json(
          { success: false, message: "Invalid payment status" },
          { status: 400 }
        );
      }
      updates.payment_status = body.payment_status;

      // If marking as paid, update total_paid to match bouquet_price
      if (body.payment_status === "PAID") {
        updates.total_paid = order.bouquet_price;
        updates.remaining_amount = 0;
      }
    }

    // Update the order
    await order.update(updates);

    // Create log entry if status changed
    if (updates.order_status || updates.payment_status) {
      const previousStatus = updates.order_status
        ? oldStatus
        : oldPaymentStatus;
      const newStatus = updates.order_status
        ? updates.order_status
        : updates.payment_status;

      // Get admin_id from request context (set by authMiddleware)
      const adminId = request.user?.id || null;

      await OrderLog.create({
        order_id: order.id,
        admin_id: adminId,
        previous_status: previousStatus,
        new_status: newStatus,
        notes: body.notes || `Status changed via admin panel`,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Update status error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
});

export const PATCH = authMiddleware(async function PATCH(request, { params }) {
  return PUT(request, { params });
});
