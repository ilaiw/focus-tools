// Focus Tools — Blocked page reason display
// The redirect rules append query params describing what triggered the block:
//   ?type=keyword&value=<keyword>   matched a blocked keyword
//   ?type=site&value=<domain>       site on the blocklist
//   ?type=category&value=<catKey>   community blocklist category
//   ?type=safesearch                safe search block rule
//   ?type=extensions                extensions page block
(async () => {
  await i18nReady;

  const params = new URLSearchParams(location.search);
  const type = params.get("type");
  if (!type) return;
  const value = params.get("value") || "";

  let label = "";
  let displayValue = value;

  if (type === "keyword") {
    label = msg("blocked_reason_keyword");
  } else if (type === "site") {
    label = msg("blocked_reason_site");
  } else if (type === "category") {
    label = msg("blocked_reason_category");
    // Category keys have localized names (blocklist_cat_porn etc.); fall back to the raw key
    const catName = msg("blocklist_cat_" + value);
    if (catName && catName !== "blocklist_cat_" + value) displayValue = catName;
  } else if (type === "safesearch") {
    label = msg("blocked_reason_safesearch");
    displayValue = "";
  } else if (type === "extensions") {
    label = msg("blocked_reason_extensions");
    displayValue = "";
  } else {
    return;
  }

  document.getElementById("reasonLabel").textContent = displayValue ? label + ": " : label;
  document.getElementById("reasonValue").textContent = displayValue;
  document.getElementById("blockReason").style.display = "";
})();
