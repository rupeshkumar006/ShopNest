import React from "react";
import axios from "axios";

export default function PayButton({ amount, orderId, onSuccess }: { amount: number, orderId: string, onSuccess: () => void }) {
  const handlePay = async () => {
    // 1. Create order on backend (if not already done)
    // const { data } = await axios.post("/backend/payments/create_order.php", { amount });
    // const { order_id } = data;

    // 2. Open Razorpay checkout
    const options = {
      key: "rzp_test_7fy599JtqrMgBX", // Replace with your Razorpay key
      amount: amount * 100, // in paise
      currency: "INR",
      name: "ShopNest",
      description: "Order Payment",
      order_id: orderId, // from backend
      handler: function (response: any) {
        // 3. Confirm payment on backend
        axios.post("/backend/payments/confirm_payment.php", {
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        }).then(() => {
          onSuccess();
        });
      },
      prefill: {
        email: "user@example.com",
        contact: "9999999999",
      },
      theme: { color: "#F37254" },
    };
    // @ts-expect-error
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return <button onClick={handlePay}>Pay with Razorpay</button>;
}
