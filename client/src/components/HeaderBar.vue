<template>
    <header class="header">
        <div class="left">
            <img src="../../public/plop-rmbg.png" alt="Logo" class="logo" />
            <h1 class="app-name">AbView</h1>
        </div>
        <div class="center">
            <span class="context">Alves</span>
        </div>
        <div class="right">
            <span class="datetime">{{ formattedDateTime }}</span>
        </div>
    </header>
</template>

<script>
export default {
    name: "HeaderBar",
    data() {
        return { 
            now: new Date()
        };
    },
    computed: {
        formattedDateTime() {
            const dateStr = this.now.toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            const timeStr = this.now.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });
            return (
                dateStr.charAt(0).toUpperCase() +
                dateStr.slice(1) +
                " | " +
                timeStr
            );
        },
    },
    mounted() {
        setInterval(() => (this.now = new Date()), 1000);
    },
};
</script>

<style scoped>
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #1e293b;
    color: white;
    padding: 1vh 0.5%;
    font-family: Arial, sans-serif;
}

.left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.center {
    font-size: 1.1rem;
    font-weight: 500;
}

.logo {
    height: 30px;
}

.app-name {
    font-weight: bold;
    font-size: 1rem;
}

.right {
    font-size: 0.9rem;
}
</style>
