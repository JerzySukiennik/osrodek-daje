// Visual feedback overlay, localhost only: pings the agentation server and mounts its React widget from a CDN.
// The live site never downloads a byte of this — the hostname check runs before any network call.

export async function mountAgentation() {
  if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return false;
  try {
    const health = await fetch("http://localhost:4747/health", { mode: "cors" }).then((r) => r.json());
    if (!health || health.status !== "ok") return false;
  } catch (e) {
    return false;
  }
  try {
    const [React, ReactDOM, mod] = await Promise.all([
      import("https://esm.sh/react@18.3.1"),
      import("https://esm.sh/react-dom@18.3.1/client?deps=react@18.3.1"),
      import("https://esm.sh/agentation@3?deps=react@18.3.1,react-dom@18.3.1")
    ]);
    const Widget = mod.Agentation || mod.default;
    if (!Widget) return false;
    const host = document.createElement("div");
    host.id = "agentation-root";
    document.body.appendChild(host);
    ReactDOM.createRoot(host).render(React.createElement(Widget, { projectName: "osrodek-daje" }));
    return true;
  } catch (e) {
    console.warn("agentation not mounted", e);
    return false;
  }
}
