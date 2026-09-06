/* ===================================================
   WORLD TRADE ROUTES — 地図描画（D3.js）
   ---------------------------------------------------
   ・世界地図（TopoJSON, 110m簡易版）を SVG に描画
   ・投影の中心を日本付近（東経140°）に回転させ、
     太平洋・大西洋どちらのルートも地図の端で分断されずに
     自然な弧で表示できるようにしている。
   ・貿易ルートは大円（great circle）を細かくサンプリングして
     LineString化し、d3.geoPath に投影させている
     （2点間の直線ではなく、実際の航路に近い弧になる）。
=================================================== */

window.TradeMap = (function () {
  const { PORTS, ROUTES, portById, regionById } = window.TRADE_DATA;

  let svg, defs, projection, pathGen, gCountries, gRoutes, gPorts;
  let width = 0, height = 0;
  let onRouteClick = null;

  // ルートIDごとの状態（ON/OFF・選択中かどうか）はUI側（main.js）が持つ。
  // ここでは「この状態で再描画して」と渡されたものをそのまま反映するだけにする。

  async function init(svgEl, { onRouteClick: clickHandler } = {}) {
    svg = d3.select(svgEl);
    onRouteClick = clickHandler || function () {};

    const viewBox = svg.node().viewBox.baseVal;
    width = viewBox.width;
    height = viewBox.height;

    // 投影：Natural Earth をベースに、中心経度を日本(140E)付近へ回転。
    // これにより「日本を中心に、東(米州)・西(アジア～欧州～中東)」という
    // レイアウトになり、6本のサンプルルートがどれも地図中央寄りに収まる。
    projection = d3.geoNaturalEarth1().rotate([-140, 0]);
    pathGen = d3.geoPath(projection);

    defs = svg.select("defs");
    if (defs.empty()) defs = svg.append("defs");

    gCountries = svg.append("g").attr("class", "tr-countries");
    gRoutes = svg.append("g").attr("class", "tr-routes");
    gPorts = svg.append("g").attr("class", "tr-ports");

    const world = await d3.json("assets/world-110m.json");
    const land = topojson.feature(world, world.objects.countries);

    projection.fitSize([width, height], land);

    gCountries
      .selectAll("path")
      .data(land.features)
      .join("path")
      .attr("class", "tr-country")
      .attr("d", pathGen);

    drawPorts();
    drawRoutes();
  }

  function drawPorts() {
    gPorts
      .selectAll("g.tr-port")
      .data(PORTS)
      .join((enter) => {
        const g = enter
          .append("g")
          .attr("class", (d) => "tr-port tr-port--" + d.region)
          .attr("transform", (d) => {
            const p = projection([d.lon, d.lat]);
            return p ? `translate(${p[0]},${p[1]})` : "translate(-9999,-9999)";
          });
        g.append("circle").attr("class", "tr-port-halo").attr("r", 9);
        g.append("circle").attr("class", "tr-port-dot").attr("r", 3.4);
        g.append("text")
          .attr("class", "tr-port-label")
          .attr("x", 8)
          .attr("y", 4)
          .text((d) => d.name);
        return g;
      });
  }

  // 2点間の大円弧を、細かくサンプリングした GeoJSON LineString にする。
  function greatCircleLine(fromPort, toPort) {
    const interpolate = d3.geoInterpolate(
      [fromPort.lon, fromPort.lat],
      [toPort.lon, toPort.lat]
    );
    const steps = 64;
    const coords = [];
    for (let i = 0; i <= steps; i++) {
      coords.push(interpolate(i / steps));
    }
    return { type: "LineString", coordinates: coords };
  }

  // ルートごとに「出発地域色 → 到着地域色」のグラデーションを作る。
  // 同じ色一色だと重なった時にどのルートか判別しづらいため、
  // 発着地域の色を引き継ぐことで見分けやすくする。
  function ensureRouteGradient(route) {
    const gradId = "tr-grad-" + route.id;
    if (!defs.select("#" + gradId).empty()) return gradId;

    const fromColor = (regionById[route.fromRegion] || {}).color || "#6a8dff";
    const toColor = (regionById[route.toRegion] || {}).color || "#a56aff";

    const grad = defs
      .append("linearGradient")
      .attr("id", gradId)
      .attr("gradientUnits", "userSpaceOnUse");
    grad.append("stop").attr("offset", "0%").attr("stop-color", fromColor);
    grad.append("stop").attr("offset", "100%").attr("stop-color", toColor);

    return gradId;
  }

  function drawRoutes() {
    const routeData = ROUTES.map((r, i) => ({
      route: r,
      index: i,
      line: greatCircleLine(portById[r.from], portById[r.to]),
    }));

    // クリック判定を広げるための「当たり判定用の太い透明パス」＋
    // 見た目用の細いグロー付きパス／流れる光点を、ルートごとに重ねる。
    const groups = gRoutes
      .selectAll("g.tr-route")
      .data(routeData, (d) => d.route.id)
      .join((enter) => {
        const g = enter
          .append("g")
          .attr("class", (d) => "tr-route tr-route--" + d.route.fromRegion + " tr-route--to-" + d.route.toRegion)
          .attr("data-route-id", (d) => d.route.id);

        g.append("path").attr("class", "tr-route-hit");
        g.append("path").attr("class", "tr-route-glow");
        g.append("path").attr("class", "tr-route-line");
        g.append("circle").attr("class", "tr-route-pulse").attr("r", 2.6);

        g.on("click", (event, d) => onRouteClick(d.route.id));
        g.on("keydown", (event, d) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onRouteClick(d.route.id);
          }
        });
        // ホバー／フォーカス中は他のルートと重なっていても見えるよう最前面へ。
        g.on("mouseenter focus", function () {
          d3.select(this).raise();
        });
        g.attr("tabindex", 0)
          .attr("role", "button")
          .attr("aria-label", (d) => d.route.name + " のルート詳細を見る");

        return g;
      });

    groups.each(function (d) {
      const d3g = d3.select(this);
      const dAttr = pathGen(d.line);
      const gradId = ensureRouteGradient(d.route);

      d3g.select(".tr-route-hit").attr("d", dAttr);
      d3g.select(".tr-route-glow").attr("d", dAttr);
      d3g
        .select(".tr-route-line")
        .attr("d", dAttr)
        .style("--tr-route-color", `url(#${gradId})`);

      // 光点はルートの弧に沿って動かす（offset-path）。
      // ルートごとに開始位置をずらし、一斉に流れて見えないようにする。
      d3g
        .select(".tr-route-pulse")
        .style("offset-path", `path('${dAttr}')`)
        .style("--tr-flow-delay", -(d.index * 0.8) + "s")
        .style("color", (regionById[d.route.fromRegion] || {}).color || "");
    });
  }

  // main.js から呼ばれる：表示ON/OFF・選択中・フィルタの見た目反映
  function applyState({ activeIds, selectedId, dimOthers }) {
    gRoutes.selectAll("g.tr-route").each(function (d) {
      const g = d3.select(this);
      const isActive = activeIds.has(d.route.id);
      const isSelected = d.route.id === selectedId;
      g.classed("is-off", !isActive);
      g.classed("is-selected", isSelected);
      g.classed("is-dimmed", dimOthers && !isSelected && isActive);
      g.attr("aria-hidden", !isActive);
    });

    const selectedRoute = ROUTES.find((r) => r.id === selectedId);
    const endpointIds = selectedRoute
      ? new Set([selectedRoute.from, selectedRoute.to])
      : new Set();

    gPorts.selectAll("g.tr-port").each(function (d) {
      const g = d3.select(this);
      const touched = isPortTouchedByActiveRoutes(d.id, activeIds);
      g.classed("is-inactive", !touched);
      g.classed("is-endpoint", endpointIds.has(d.id));
    });
  }

  function isPortTouchedByActiveRoutes(portId, activeIds) {
    return ROUTES.some(
      (r) => activeIds.has(r.id) && (r.from === portId || r.to === portId)
    );
  }

  return { init, applyState };
})();
