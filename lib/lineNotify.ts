import axios from 'axios';

export async function sendLineNotify(token: string, message: string, imageUrl?: string) {
    try {
        const formData = new URLSearchParams();
        formData.append('message', message);
        if (imageUrl) {
            formData.append('imageThumbnail', imageUrl);
            formData.append('imageFullsize', imageUrl);
        }

        await axios.post('https://notify-api.line.me/api/notify', formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return true;
    } catch (error) {
        console.error('Line Notify Error:', error);
        return false;
    }
}
