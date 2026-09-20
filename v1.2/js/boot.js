// Role router: ?role=pad opens the phone controller, anything else opens the TV display.

const params = new URLSearchParams(location.search);
const role = params.get("role") || (params.get("room") && /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "pad" : "display");

if (role === "pad") {
  const { startPad } = await import("./pad/main.js");
  startPad(document.getElementById("pad-root"));
} else {
  const { startDisplay } = await import("./display/main.js");
  startDisplay(document.getElementById("tv-root"), document.getElementById("gl"));
}
