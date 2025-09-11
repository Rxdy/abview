export function shortLocation(location) {
    if (typeof location !== "string") return location || "";
    return location.split(",")[0];
}

export function truncateHtml(html, limit) {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    let text = temp.innerText;
    if (text.length > limit) text = text.slice(0, limit) + "…";
    return text.replace(/\n/g, "<br>");
}
