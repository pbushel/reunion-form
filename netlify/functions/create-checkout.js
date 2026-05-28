const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {

  // ✅ HANDLE PREFLIGHT
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  try {

    const { amount, firstName, lastName, email, phone, adultShirts, kidsShirts, dues } =
      JSON.parse(event.body);

    // ✅ Validate amount
    if (isNaN(amount) || amount <= 0) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ error: "Invalid amount received" })
      };
    }

    // ✅ Send to Google Sheets
    await fetch("https://script.google.com/macros/s/AKfycbxzocf7EBTK8mIdA8nA8UprPCJurGgw_C-filj4cvSqhVyziKrYQvJzgf5U5Ef85uAO1w/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        adultShirts,
        kidsShirts,
        dues,
        total: amount,
        status: "Paid"
      })
    });

    // ✅ Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,

      metadata: {
        name: firstName + " " + lastName,
        phone: phone,
        total: amount
      },

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Tucker‑Bushel(l) T‑Shirt Order"
            },
            unit_amount: amount * 100
          },
          quantity: 1
        }
      ],

      mode: "payment",
      success_url: "https://gorgeous-crepe-f1522b.netlify.app/success.html",
      cancel_url: "https://gorgeous-crepe-f1522b.netlify.app"
    });

    // ✅ SUCCESS RESPONSE WITH CORS
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: JSON.stringify({ url: session.url })
    };

  } catch (error) {

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: error.message })
    };

  }
};
