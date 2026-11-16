// Minimal stand-in for the "framer" package: only what ArcoviaContact/ArcoviaBase import.
import * as React from "react";
export function addPropertyControls() {}
export const ControlType = new Proxy({}, { get: (_, k) => String(k) });
export const RenderTarget = { canvas: "CANVAS", preview: "PREVIEW", thumbnail: "THUMBNAIL", export: "EXPORT", current: () => "PREVIEW" };
export function Link({ href, children }) {
  return React.isValidElement(children) ? React.cloneElement(children, { href }) : children;
}
