export async function calculateMethod(task, method, payload) {
    const response = await fetch(`/api/v1/calculate/${task}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Server error');
    }
    return data;
}
