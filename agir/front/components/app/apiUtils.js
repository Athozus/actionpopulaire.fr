
import axios from "@agir/lib/utils/axios";

export async function post(url, data) {
    const result = {
        data: null,
        error: null,
    }
    try {
        const response = await axios.post(url, data ?? {})
        result.data = response.data
    } catch (e) {
        result.error = e?.response?.data ?? e.message
    }

    return result

}