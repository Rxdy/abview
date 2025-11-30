<template>
    <div class="notification-modal">
        <div class="modal-content">
            <h2>Notification : {{ event.title }}</h2>
            <p>
                Heure : {{ event.startTime
                }}<span v-if="event.endTime"> - {{ event.endTime }}</span>
            </p>
            <p v-if="event.description" v-html="event.description"></p>
            <p v-if="event.location">Lieu : {{ event.location }}</p>
            <div class="progress-bar"></div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    event: {
        type: Object,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
});

defineEmits(["close"]);
</script>

<style scoped>
.notification-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}
.modal-content {
    background-color: var(--module-bg, #e0e0e0);
    padding: clamp(15px, 3vh, 30px);
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    animation: fadeIn 0.3s;
    width: 80%;
    max-width: 600px;
}
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
.modal-content h2 {
    margin-bottom: 10px;
    font-size: clamp(1.2rem, 3vh, 2rem);
}
.modal-content p {
    margin-bottom: 10px;
    font-size: clamp(1rem, 2.5vh, 1.5rem);
}
.progress-bar {
    width: 100%;
    height: clamp(8px, 1.5vh, 15px);
    background-color: #4b5563;
    border-radius: 5px;
    overflow: hidden;
    margin-top: 10px;
}
.progress-bar::before {
    content: "";
    display: block;
    width: 100%;
    height: 100%;
    background-color: #2196f3;
    animation: consume 15s linear forwards;
}
@keyframes consume {
    from {
        width: 100%;
    }
    to {
        width: 0;
    }
}
</style>
