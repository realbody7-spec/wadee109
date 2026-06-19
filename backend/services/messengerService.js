import axios from 'axios';

/**
 * Sends a message via Facebook Messenger Send API
 * @param {string} pageAccessToken - Facebook Page Access Token
 * @param {string} recipientId - Target Page-Scoped User ID (PSID)
 * @param {string} message - Message text
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendMessengerMessage(pageAccessToken, recipientId, message) {
  if (!pageAccessToken || !recipientId) {
    return { success: false, message: 'Facebook Page Access Token and Recipient PSID are required' };
  }

  try {
    const response = await axios.post(`https://graph.facebook.com/v12.0/me/messages?access_token=${pageAccessToken}`, {
      recipient: {
        id: recipientId
      },
      message: {
        text: message
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      return { success: true, message: 'Messenger message sent successfully' };
    }
    return { success: false, message: `Messenger API returned status: ${response.status}` };
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    return { success: false, message: `Messenger Error: ${errorMsg}` };
  }
}
