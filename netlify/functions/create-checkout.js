const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

exports.handler = async (event) => {

  // ✅ Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  // ✅ Reject anything not POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const data = JSON.parse(event.body);

    const {
      amount,
      firstName,
      lastName,
      email,
      phone,
      adultShirts,
      kidsShirts,
      dues
    } = data;

    if (!amount || isNaN(amount) || amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid amount" })
      };
    }

    const orderId = "ORD-" + Date.now();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,

      metadata: {
        orderId,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        phone,
        adultShirts,
        kidsShirts,
        dues
      },

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Tucker‑Bushel(l) T‑Shirt Order"
            },
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }
      ],

      mode: "payment",

      success_url: "https://gorgeous-crepe-f1522b.netlify.app/success.html",
      cancel_url: "https://gorgeous-crepe-f1522b.netlify.app"
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url })
    };

  } catch (error) {
    console.error("STRIPE ERROR:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
