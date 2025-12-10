<template>
    <footer class="footer">
        <div class="left">{{ timeZone }} (UTC{{ utcOffset }})</div>
        <div class="center">Développé par {{ developerName }}</div>
        <div class="right">© {{ currentYear }} AbView v1.3.5</div>
    </footer>
</template>

<script>
export default {
    name: "FooterBar",
    data() {
        return {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            utcOffset: this.getUtcOffset(),
            developerName: "Rudy ALVES",
            currentYear: new Date().getFullYear(),
        };
    },
    methods: {
        getUtcOffset() {
            const offsetMinutes = new Date().getTimezoneOffset();
            const sign = offsetMinutes <= 0 ? "+" : "-";
            const hours = String(
                Math.floor(Math.abs(offsetMinutes) / 60)
            ).padStart(2, "0");
            const minutes = String(Math.abs(offsetMinutes) % 60).padStart(
                2,
                "0"
            );
            return `${sign}${hours}:${minutes}`;
        },
    },
};
</script>

<style scoped>
.footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #1e293b;
    color: white;
    padding: 0.5vh 1%;
    font-family: Arial, sans-serif;
    font-size: clamp(0.7rem, 1.2vh, 1rem);
    height: 3vh;
    min-height: 20px;
}

.left,
.center,
.right {
    flex: 1;
    text-align: center;
}

.left {
    text-align: left;
}

.right {
    text-align: right;
}
</style>
