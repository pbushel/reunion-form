const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {

  const sig = event.headers["stripe-signature"];

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`
    };
  }

  // ✅ ONLY HANDLE SUCCESSFUL PAYMENTS
  if (stripeEvent.type === "checkout.session.completed") {

    const session = stripeEvent.data.object;

    // ✅ GET metadata from Stripe session
    const data = session.metadata;

    // ✅ SEND TO GOOGLE SHEETS
    await fetch(process.env.GOOGLE_SCRIPT_URL, {
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
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true })
  };
};