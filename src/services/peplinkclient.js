import axios from "axios";

const BASE_URL = process.env.PEPLINK_BASE_URL;

let accessToken = null;
let expiresAt = 0;

async function getToken() {

    if (accessToken && Date.now() < expiresAt) {
        return accessToken;
    }

    const response = await axios.post(
        `${BASE_URL}/api/oauth2/token`,
        {
            client_id: process.env.PEPLINK_CLIENT_ID,
            client_secret: process.env.PEPLINK_CLIENT_SECRET,
            grant_type: "client_credentials"
        }
    );

    accessToken = response.data.access_token;
    expiresAt = Date.now() + ((response.data.expires_in || 3600) - 60) * 1000;

    return accessToken;
}

export async function peplinkGet(path, params = {}) {

    const token = await getToken();

    const response = await axios.get(
        `${BASE_URL}/api${path}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            },
            params
        }
    );

    return response.data;
}