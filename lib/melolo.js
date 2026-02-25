import axios from 'axios';

// 1. GENERATORS & UTILS
const generateRandomId = (length = 19) => {
    let result = '';
    result += Math.floor(Math.random() * 9) + 1;
    for (let i = 1; i < length; i++) {
        result += Math.floor(Math.random() * 10);
    }
    return result;
};

const generateOpenUdid = () => {
    return 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => {
        return (Math.random() * 16 | 0).toString(16);
    });
};

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const generateRticket = () => {
    return String(Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000));
};

const CONFIG = {
    BASE_URL: "https://api.tmtreader.com",
    HEADERS: {
        "Host": "api.tmtreader.com",
        "Accept": "application/json; charset=utf-8,application/x-protobuf",
        "X-Xs-From-Web": "false",
        "Age-Range": "8",
        "Sdk-Version": "2",
        "Passport-Sdk-Version": "50357",
        "X-Vc-Bdturing-Sdk-Version": "2.2.1.i18n",
        "User-Agent": "ScRaPe/9.9 (KaliLinux; Nusantara Os; My/Shannz)"
    },
    COMMON_PARAMS: {
        "iid": generateRandomId(19),
        "device_id": generateRandomId(19),
        "ac": "wifi",
        "channel": "gp",
        "aid": "645713",
        "app_name": "Melolo",
        "version_code": "49819",
        "version_name": "4.9.8",
        "device_platform": "android",
        "os": "android",
        "ssmix": "a",
        "device_type": "ScRaPe",
        "device_brand": "Shannz",
        "language": "in",
        "os_api": "28",
        "os_version": "15",
        "openudid": generateOpenUdid(),
        "manifest_version_code": "49819",
        "resolution": "9001600",
        "dpi": "320",
        "update_version_code": "49819",
        "current_region": "ID",
        "carrier_region": "ID",
        "app_language": "id",
        "sys_language": "in",
        "app_region": "ID",
        "sys_region": "ID",
        "mcc_mnc": "46002",
        "carrier_region_v2": "460",
        "user_language": "id",
        "time_zone": "Asia/Jakarta",
        "ui_language": "in",
        "cdid": generateUUID(),
    }
};

const request = async (method, endpoint, params = {}, data = null, customHeaders = {}) => {
    try {
        const url = `${CONFIG.BASE_URL}${endpoint}`;
        const finalParams = {
            ...CONFIG.COMMON_PARAMS,
            ...params,
            "_rticket": generateRticket()
        };
        const config = {
            method,
            url,
            headers: {
                ...CONFIG.HEADERS,
                ...customHeaders
            },
            params: finalParams,
            data
        };
        const response = await axios(config);
        return response.data;
    } catch (error) {
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        throw new Error(`Melolo API Error: ${errorMsg}`);
    }
};

const getProxyUrl = (url) => {
    if (!url) return url;
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
};

// --- API MAPPER ---

export const search = async (query, offset = 0, limit = 10) => {
    const endpoint = '/i18n_novel/search/page/v1/';
    const params = {
        "search_source_id": "clks###",
        "IsFetchDebug": "false",
        "offset": offset,
        "cancel_search_category_enhance": "false",
        "query": query,
        "limit": limit,
        "search_id": ""
    };
    const json = await request('GET', endpoint, params);
    const searchData = json?.data?.search_data || [];
    const results = [];
    if (Array.isArray(searchData)) {
        searchData.forEach(section => {
            if (section.books && Array.isArray(section.books)) {
                section.books.forEach(book => {
                    results.push({
                        bookId: book.book_id,
                        bookName: book.book_name,
                        cover: getProxyUrl(book.thumb_url),
                        author: book.author,
                        introduction: book.abstract,
                        status: book.show_creation_status,
                        tags: book.stat_infos || [],
                        chapterCount: book.serial_count || book.last_chapter_index
                    });
                });
            }
        });
    }
    return { success: true, data: results };
};

export const detail = async (bookId) => {
    if (!bookId) throw new Error("Book ID required");
    const endpoint = '/novel/player/video_detail/v1/';
    const headers = {
        "X-Ss-Stub": "238B6268DE1F0B757306031C76B5397E",
        "Content-Type": "application/json; charset=utf-8"
    };
    const payload = {
        "biz_param": {
            "detail_page_version": 0,
            "from_video_id": "",
            "need_all_video_definition": false,
            "need_mp4_align": false,
            "source": 4,
            "use_os_player": false,
            "video_id_type": 1
        },
        "series_id": bookId
    };
    const json = await request('POST', endpoint, {}, payload, headers);
    const data = json?.data?.video_data || {};
    
    let tags = [];
    try {
        if (data.category_schema) {
            const parsed = JSON.parse(data.category_schema);
            tags = parsed.map(cat => cat.name);
        }
    } catch (e) {
        console.warn("Gagal parse category_schema");
    }

    const videoList = data.video_list || [];
    const episodes = videoList.map(v => ({
        chapterId: v.vid,
        chapterIndex: v.vid_index,
        chapterName: v.title,
        duration: v.duration,
        likes: v.digged_count,
        cover: getProxyUrl(v.cover)
    }));

    // Find author
    let author = data.author || data.series_author || "";

    // If author missing, try to search it back using the title
    if (!author || author === "") {
        try {
            const searchRes = await search(data.series_title, 0, 1);
            if (searchRes.success && searchRes.data.length > 0) {
                const sData = searchRes.data[0];
                if (sData.bookId === bookId || sData.bookName === data.series_title) {
                    author = sData.author;
                }
            }
        } catch (e) {
            console.warn("Fallback search failed for author");
        }
    }

    return {
        success: true,
        data: {
            bookId: data.series_id_str || bookId,
            bookName: data.series_title,
            author: author || "Misterius",
            introduction: data.series_intro,
            cover: getProxyUrl(data.series_cover),
            chapterCount: data.episode_cnt,
            tags: tags,
            episodes: episodes
        }
    };
};

export const getEpisode = async (bookId, index) => {
    const detailsRes = await detail(bookId);
    if (!detailsRes.success) return detailsRes;

    const episodes = detailsRes.data.episodes || [];
    
    // Find episode by index
    const targetEp = episodes.find(v => v.chapterIndex == index);
    if (!targetEp) return { success: false, message: "Episode not found" };

    // Get stream URL
    const streamData = await linkStream(targetEp.chapterId);
    
    return {
        success: true,
        data: {
            chapterId: targetEp.chapterId,
            chapterIndex: targetEp.chapterIndex,
            chapterName: targetEp.chapterName,
            playUrl: streamData.url,
            cover: getProxyUrl(targetEp.cover)
        }
    };
};

export const linkStream = async (videoId) => {
    if (!videoId) throw new Error("Video ID required");
    const endpoint = '/novel/player/video_model/v1/';
    const headers = {
        "X-Ss-Stub": "B7FB786F2CAA8B9EFB7C67A524B73AFB",
        "Content-Type": "application/json; charset=utf-8"
    };
    const payload = {
        "biz_param": {
            "detail_page_version": 0,
            "device_level": 3,
            "from_video_id": "",
            "need_all_video_definition": true,
            "need_mp4_align": false,
            "source": 4,
            "use_os_player": false,
            "video_id_type": 0,
            "video_platform": 3
        },
        "video_id": videoId
    };
    const json = await request('POST', endpoint, {}, payload, headers);
    const raw = json?.data || {};
    
    let bestUrl = raw.main_url;
    
    // Try to get various quality if model exists
    if (raw.video_model) {
        try {
            const model = JSON.parse(raw.video_model);
            if (model.video_list) {
                const list = Object.values(model.video_list).sort((a,b) => b.size - a.size);
                if (list.length > 0) {
                    let url = list[0].main_url;
                    if (url && !url.startsWith('http')) {
                        url = Buffer.from(url, 'base64').toString('utf-8');
                    }
                    bestUrl = url;
                }
            }
        } catch (e) {}
    }

    return {
        url: bestUrl,
        status: true
    };
};

// --- HOME & SECTIONS ---

export const latest = async () => {
    // Simulate latest by searching for "2025" or blank
    const res = await search("Hot", 0, 15);
    return { success: true, data: res.data };
};

export const trendings = async () => {
    // Simulate trending
    const res = await search("Boss", 0, 10);
    return { success: true, data: res.data };
};

export const foryou = async () => {
    // Simulate recommendations
    const res = await search("Cinta", 0, 15);
    return { success: true, data: res.data };
};

export const vip = async () => {
    // Melolo doesn't explicitly have a VIP section in this scraper, reuse trending
    const res = await search("VIP", 0, 15);
    return { success: true, data: res.data };
};

export const populersearch = async () => {
    return { success: true, data: ["Boss", "Nikah", "CEO", "Cinta", "Sekretaris", "Sultan"] };
};

export const randomdrama = async () => {
    const res = await search("Drama", 0, 1);
    return { success: true, data: res.data[0] || {} };
};

export const dubindo = async () => {
    // Melolo might not have many dub indo, search for it
    const res = await search("Indonesia", 0, 15);
    return { success: true, data: res.data };
};
