// ===================================================
// おかぽるPLANTS — Stripe Checkout Session 照会（Netlify Function）
// ---------------------------------------------------
// 購入完了ページ（okapo-planet/green/purchase-complete.html）から、
// ?session_id= の値をもとに呼び出される。
//
// success_url にリダイレクトされただけ（＝URLを手入力しただけ）で
// 「購入完了」と表示されてしまわないよう、必ずStripe側に問い合わせて
// payment_status が "paid" であることを確認したうえで結果を返す。
// ===================================================
const STRIPE_API_BASE = "https://api.stripe.com/v1";

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY is not set");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "サーバー側の決済設定が未完了です。" }),
    };
  }

  const sessionId = event.queryStringParameters && event.queryStringParameters.session_id;
  if (!sessionId) {
    return { statusCode: 400, body: JSON.stringify({ error: "session_id が指定されていません。" }) };
  }

  let stripeRes;
  try {
    stripeRes = await fetch(`${STRIPE_API_BASE}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
  } catch (err) {
    console.error("Stripe request failed:", err);
    return { statusCode: 502, body: JSON.stringify({ error: "決済サービスへの接続に失敗しました。" }) };
  }

  const data = await stripeRes.json();

  if (!stripeRes.ok) {
    console.error("Stripe API error:", data);
    return { statusCode: 502, body: JSON.stringify({ error: "決済情報を取得できませんでした。" }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      paymentStatus: data.payment_status,
      amountTotal: data.amount_total,
      currency: data.currency,
      productId: data.metadata ? data.metadata.productId : null,
    }),
  };
};
