// Toast Notification Utility
function showToast(message, type = 'success') {
    // Check if container exists, if not create it
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon based on type
    const icon = type === 'success' ? '✅' : '⚠️';
    
    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${icon}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300); // Wait for transition to finish
    }, 3000);
}
