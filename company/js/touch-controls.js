// Separate pointer ownership lets one finger move while another looks around.
export function bindTouchControls({ pad, stick, canvas, active, locked, look, onTouch }) {
  const movement = { x: 0, y: 0 };
  let movePointer = null, lookPointer = null, center = null, lastLook = null;
  function release(element, id) {
    if (id !== null && element.hasPointerCapture(id)) element.releasePointerCapture(id);
  }
  function stopMove() {
    const id = movePointer; movePointer = null; center = null;
    movement.x = movement.y = 0;
    stick.style.transform = 'translate(0px, 0px)';
    pad.classList.remove('is-active'); release(pad, id);
  }
  function stopLook() {
    const id = lookPointer; lookPointer = null; lastLook = null;
    release(canvas, id);
  }
  function updateMove(event) {
    const dx = event.clientX - center.x, dy = event.clientY - center.y;
    const distance = Math.hypot(dx, dy), amount = Math.min(distance / center.radius, 1);
    const strength = Math.max(0, (amount - .12) / .88);
    movement.x = distance ? dx / distance * strength : 0;
    movement.y = distance ? -dy / distance * strength : 0;
    const visual = Math.min(distance, center.radius);
    stick.style.transform = `translate(${distance ? dx / distance * visual : 0}px, ${distance ? dy / distance * visual : 0}px)`;
  }
  pad.addEventListener('pointerdown', event => {
    if (!active() || movePointer !== null || event.button > 0) return;
    event.preventDefault(); onTouch();
    const rect = pad.getBoundingClientRect();
    center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, radius: rect.width * .32 };
    movePointer = event.pointerId; pad.setPointerCapture(movePointer);
    pad.classList.add('is-active'); updateMove(event);
  });
  pad.addEventListener('pointermove', event => {
    if (event.pointerId !== movePointer || !active()) return;
    event.preventDefault(); updateMove(event);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    pad.addEventListener(type, event => { if (event.pointerId === movePointer) stopMove(); });
  }
  canvas.addEventListener('pointerdown', event => {
    if (!active() || locked() || lookPointer !== null || event.button > 0) return;
    event.preventDefault();
    if (event.pointerType === 'touch') onTouch();
    lookPointer = event.pointerId; lastLook = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(lookPointer); canvas.focus({ preventScroll: true });
  });
  canvas.addEventListener('pointermove', event => {
    if (event.pointerId !== lookPointer || !active() || locked()) return;
    event.preventDefault();
    look(event.clientX - lastLook.x, event.clientY - lastLook.y);
    lastLook = { x: event.clientX, y: event.clientY };
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(type, event => { if (event.pointerId === lookPointer) stopLook(); });
  }
  return { movement, reset() { stopMove(); stopLook(); } };
}
