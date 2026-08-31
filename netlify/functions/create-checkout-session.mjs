// ===================================================
// おかぽるPLANTS — Stripe Checkout Session 作成（Netlify Function）
// ---------------------------------------------------
// クライアント（js/planet-detail.js）から { productId } を受け取り、
// Stripeのテスト決済（Checkoutのホスト型決済画面）へのURLを返す。
//
// ・秘密鍵（STRIPE_SECRET_KEY）はこの関数（サーバー側）でのみ扱い、
//   クライアントやGitには一切含めない（Netlifyの環境変数から読む）。
// ・価格はクライアントの入力値を信用せず、必ずサーバー側の
//   js/planet-data.js（唯一の商品データソース）から取得する。
// ・依存パッケージ（stripeパッケージ等）は使わず、Stripeの
//   REST APIをfetchで直接呼び出す（追加のnpm依存を増やさないため）。
// ===================================================
import { getProductById, getCategoryBySlug } from "../../js/planet-data.js";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

// Stripeの REST API は application/x-www-form-urlencoded で、
// ネストしたオブジェクト/配列は line_items[0][price_data][currency] の
// ようなブラケット記法で表現する。ここではJSオブジェクトから
// そのURLエンコード済みボディを組み立てる。
function toStripeParams(obj) {
  const params = new URLSearchParams();

  function walk(value, key) {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${key}[${i}]`));
    } else if (typeof value === "object") {
      Object.entries(value).forEach(([k, v]) => walk(v, `${key}[${k}]`));
    } else {
      params.append(key, String(value));
    }
  }

  Object.entries(obj).forEach(([key, value]) => walk(value, key));
  return params;
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY is not set");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "サーバー側の決済設定が未完了です。時間をおいて再度お試しください。" }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "リクエストの内容を読み取れませんでした。" }) };
  }

  const product = typeof payload.productId === "string" ? getProductById(payload.productId) : null;
  if (!product) {
    return { statusCode: 400, body: JSON.stringify({ error: "指定された商品が見つかりませんでした。" }) };
  }
    // 販売状態をサーバー側でも確認する。
  // "soon" の商品は、画面を経由せず直接Functionを呼ばれても
  // Stripe Checkoutを作成しない。
  const category = getCategoryBySlug(product.category);

  if (!category || category.status !== "open") {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "現在この商品は販売停止中です。" }),
    };
  }

  // success_url / cancel_url の組み立てに使うサイトの基点URL。
  // fetchのOriginヘッダー（同一オリジンからのPOSTなら必ず付く）を優先し、
  // 取得できない場合のみRefererから補う。
  const headers = event.headers || {};
  let origin = headers.origin || null;
  if (!origin && headers.referer) {
    try {
      origin = new URL(headers.referer).origin;
    } catch {
      origin = null;
    }
  }
  if (!origin) {
    return { statusCode: 400, body: JSON.stringify({ error: "リクエスト元を確認できませんでした。" }) };
  }

  // line_items: 商品本体は常に1件目。product.shippingFee（数値・円）を
  // 持つ商品のみ、2件目に「送料」という名前の明細行を追加する。
  // shippingFee を持たない商品（既存GREEN商品・送料込み商品など）は
  // 従来どおり商品1件のみの配列になり、決済額は一切変わらない。
  const lineItems = [
    {
      quantity: 1,
      price_data: {
        currency: "jpy",
        unit_amount: product.price,
        product_data: { name: product.name },
      },
    },
  ];

  if (typeof product.shippingFee === "number" && product.shippingFee > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "jpy",
        unit_amount: product.shippingFee,
        product_data: { name: "送料" },
      },
    });
  }

  // success_url / cancel_url は商品の category（= okapo-planet/ 配下のディレクトリ名）に
  // 合わせて動的に組み立てる。以前は "green" に決め打ちしていたため、GREEN以外の
  // カテゴリーの商品を追加すると誤ったパスに遷移してしまう問題があった。
  // 既存のGREEN商品は category:"green" のため、挙動は従来どおり変わらない。
  const params = toStripeParams({
    mode: "payment",
    payment_method_types: ["card"],
    success_url: `${origin}/okapo-planet/${product.category}/purchase-complete.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/okapo-planet/${product.category}/product.html?id=${encodeURIComponent(product.id)}`,
    line_items: lineItems,
    metadata: { productId: product.id },
  });

  let stripeRes;
  try {
    stripeRes = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
  } catch (err) {
    console.error("Stripe request failed:", err);
    return { statusCode: 502, body: JSON.stringify({ error: "決済サービスへの接続に失敗しました。" }) };
  }

  const data = await stripeRes.json();

  if (!stripeRes.ok) {
    console.error("Stripe API error:", data);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "決済セッションの作成に失敗しました。" }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ url: data.url }),
  };
};
