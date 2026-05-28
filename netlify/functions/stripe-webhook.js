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
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          adultShirts: data.adultShirts,
          kidsShirts: data.kidsShirts,
          dues: data.dues,
          total: session.amount_total / 100,
          status: "Paid"
        })
      });

      const text = await response.text();

      console.log("✅ Google response:", text);

    } catch (err) {
      console.error("❌ Error sending to Google:", err);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true })
  };
};
