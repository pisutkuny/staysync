const fetch = require('node-fetch');

async function testWebhook() {
    const userId = "U_SIMULATED_USER_" + Math.floor(Math.random() * 1000);
    const code = process.argv[2]; // Get code from command line

    console.log("--- Simulating Line Webhook ---");
    console.log("1. Simulating 'Follow' event...");

    // Simulate Follow
    await fetch('http://localhost:3000/api/webhook/line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            events: [{
                type: 'follow',
                replyToken: 'dummy_token',
                source: { userId: userId },
                mode: 'active'
            }]
        })
    });
    console.log(`> Follow event sent for ${userId}`);

    if (code) {
        console.log(`2. Simulating 'Message' event with code: ${code}...`);
        await new Promise(r => setTimeout(r, 1000)); // Wait a bit

        await fetch('http://localhost:3000/api/webhook/line', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                events: [{
                    type: 'message',
                    replyToken: 'dummy_token',
                    source: { userId: userId },
                    message: { type: 'text', text: code }
                }]
            })
        });
        console.log("> Verification message sent!");
        console.log("Check the Resident Profile URL to see if 'Line Connection' turn green.");
    } else {
        console.log("\nUsage: node simulate_webhook.js <#VERIFY_CODE>");
        console.log("To fully test linking, provide a valid code generated from the UI.");
    }
}

testWebhook().catch(console.error);
