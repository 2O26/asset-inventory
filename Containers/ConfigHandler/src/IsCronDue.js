function IsCronDue(cronSchedule) {
    try {
        const now = new Date();
        const [minute, hour, dayOfMonth, month, dayOfWeek] = cronSchedule.split(' ').map(s => s.trim());

        // Cron months start from 1 (January) to 12 (December), JavaScript months from 0 to 11
        const matchesMonth = month === '*' || parseInt(month) === now.getMonth() + 1;
        const matchesDayOfMonth = dayOfMonth === '*' || parseInt(dayOfMonth) === now.getDate();
        // Day of week in both cron and JavaScript is 0 (Sunday) to 6 (Saturday)
        const matchesDayOfWeek = dayOfWeek === '*' || parseInt(dayOfWeek) === now.getDay();
        const matchesHour = hour === '*' || parseInt(hour) === now.getHours();
        const matchesMinute = minute === '*' || parseInt(minute) === now.getMinutes();

        return matchesMonth && matchesDayOfMonth && matchesDayOfWeek && matchesHour && matchesMinute;
    } catch (err) {
        console.error('Error parsing cron expression:', err.message);
        return false;
    }
}

module.exports = { IsCronDue }