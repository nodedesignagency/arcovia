// Minimal stand-in for the "framer" module, so Arcovia code components can be
// bundled and tested in a plain browser. ?canvas=1 makes RenderTarget report the canvas.
const target = typeof location !== "undefined" && /[?&]canvas=1\b/.test(location.search) ? "CANVAS" : "PREVIEW"
export const RenderTarget = { canvas: "CANVAS", preview: "PREVIEW", thumbnail: "THUMBNAIL", export: "EXPORT", current: () => target }
export const ControlType = new Proxy({}, { get: (_, k) => String(k) })
export function addPropertyControls(component, controls) { component.propertyControls = controls }
export function addFonts() {}
