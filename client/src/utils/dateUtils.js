export function formatDayName(dateStr) {
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    return days[new Date(dateStr).getDay()];
}

export function formatDate(dateStr) {
    return dateStr.slice(8, 10) + "/" + dateStr.slice(5, 7);
}

export function formatLastUpdate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function isToday(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normaliser à minuit
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    const day = today.getDate().toString().padStart(2, "0");
    const localDateStr = `${year}-${month}-${day}`;
    console.log(`isToday: Comparaison ${dateStr} === ${localDateStr}`);
    return dateStr === localDateStr;
}

export function getEventDate(dateStr) {
    return dateStr.includes("T") ? dateStr.slice(0, 10) : dateStr;
}

export function getTime(dateStr) {
    if (!dateStr.includes("T")) return null;
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Paris",
    });
}
