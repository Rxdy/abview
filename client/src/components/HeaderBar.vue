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
            <span class="datetime">{{ formattedDate }} | {{ formattedTime }}</span>
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
        formattedDate() {
            const dateStr = this.now.toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        },
        formattedTime() {
            return this.now.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });
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
    padding: 0 1%;
    font-family: Arial, sans-serif;
    height: 5%;
}

.left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
}

.center {
    font-size: clamp(1.5rem, 1.8vh, 1.3rem);
    font-weight: 500;
    flex: 1;
    text-align: center;
}

.logo {
    height: 5.5vh;
    min-height: 20px;
}

.app-name {
    font-weight: bold;
    font-size: clamp(1.5rem, 1.8vh, 1.3rem);
    margin: 0;
}

.right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

.datetime {
    font-size: clamp(1.5rem, 1.8vh, 1.3rem);
    font-weight: 500;
}
</style>
