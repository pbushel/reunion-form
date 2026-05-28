const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const { amount, firstName, lastName, email, phone, adultShirts, kidsShirts, dues } = JSON.parse(event.body);
  
  // ✅ ADD THIS BLOCK RIGHT HERE
    if (isNaN(amount) || amount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid amount received" })
      };
    }

  // ✅ SEND DATA TO GOOGLE SHEETS
  await fetch("https://script.google.com/macros/s/AKfycbxzocf7EBTK8mIdA8nA8UprPCJurGgw_C-filj4cvSqhVyziKrYQvJzgf5U5Ef85uAO1w/exec", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName,
      lastName,
      email,
      phone,
    
      adultShirts,   // ✅ USE REAL VALUE
      kidsShirts,    // ✅ USE REAL VALUE
      dues,          // ✅ USE REAL VALUE
    
      total: amount,
      status: "Paid"
    })


  });

  try {
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
    cancel_url: "https://gorgeous-crepe-f1522b.netlify.app",

    });

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
    body: JSON.stringify({ error: err.message })
  };
  
  }
};
