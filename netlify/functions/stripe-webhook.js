const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {

  console.log("✅ Webhook triggered");

  const sig = event.headers["stripe-signature"];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Signature error:", err.message);
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`
    };
  }

  console.log("✅ Event type:", stripeEvent.type);

  if (stripeEvent.type === "checkout.session.completed") {

    const session = stripeEvent.data.object;

    console.log("✅ Session received");

    const data = session.metadata || {};

    console.log("✅ Metadata:", data);

    try {
      const response = await fetch(process.env.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
