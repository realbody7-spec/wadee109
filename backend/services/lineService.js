import axios from 'axios';

/**
 * Sends a message via LINE Notify
 * @param {string} token - LINE Notify Personal Access Token
 * @param {string} message - Message text
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendLineNotify(token, message) {
  if (!token) {
    return { success: false, message: 'LINE Notify Token is required' };
  }

  try {
    const params = new URLSearchParams();
    params.append('message', message);

    const response = await axios.post('https://notify-api.line.me/api/notify', params, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.status === 200) {
      return { success: true, message: 'LINE Notify sent successfully' };
    }
    return { success: false, message: `LINE Notify API returned status: ${response.status}` };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    return { success: false, message: `LINE Notify Error: ${errorMsg}` };
  }
}

/**
 * Sends a message via LINE Messaging API (Push message)
 * @param {string} channelAccessToken - LINE Channel Access Token
 * @param {string} userId - Target Line User/Group ID
 * @param {string} message - Message text
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendLinePush(channelAccessToken, userId, message) {
  if (!channelAccessToken || !userId) {
    return { success: false, message: 'LINE Channel Access Token and User ID are required' };
  }

  try {
    const response = await axios.post('https://api.line.me/v2/bot/message/push', {
      to: userId,
      messages: [
        {
          type: 'text',
          text: message
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      return { success: true, message: 'LINE Push Message sent successfully' };
    }
    return { success: false, message: `LINE Push API returned status: ${response.status}` };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    return { success: false, message: `LINE Push Error: ${errorMsg}` };
  }
}

/**
 * Sends a reply message via LINE Messaging API
 * @param {string} channelAccessToken - LINE Channel Access Token
 * @param {string} replyToken - Reply token from Webhook event
 * @param {string} message - Message text
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendLineReply(channelAccessToken, replyToken, message) {
  if (!channelAccessToken || !replyToken) {
    return { success: false, message: 'LINE Channel Access Token and Reply Token are required' };
  }

  try {
    const response = await axios.post('https://api.line.me/v2/bot/message/reply', {
      replyToken: replyToken,
      messages: [
        {
          type: 'text',
          text: message
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      return { success: true, message: 'LINE Reply sent successfully' };
    }
    return { success: false, message: `LINE Reply API returned status: ${response.status}` };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    return { success: false, message: `LINE Reply Error: ${errorMsg}` };
  }
}
