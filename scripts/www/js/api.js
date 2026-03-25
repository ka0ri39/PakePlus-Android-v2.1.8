/**
 * API 请求封装
 * 统一处理所有API调用，包含错误处理、加载状态等
 */

// ===== 全局配置对象 =====
window.CONFIG = (() => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    let baseUrl;
    // 如果是file://协议或hostname为空，使用默认后端地址
    if (protocol === 'file:' || !hostname) {
        baseUrl = 'http://192.168.1.50:5000/api';
    }
    // localhost环境
    else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        baseUrl = 'http://localhost:5000/api';
    }
    // 其他环境（部署环境）
    else {
        baseUrl = `http://${hostname}:5000/api`;
    }
    
    return {
        API_BASE_URL: baseUrl,
        BASE_URL: baseUrl,
        UPLOAD_URL: baseUrl.replace('/api', ''),
        API_TIMEOUT: 30000,
        RETRY_TIMES: 3
    };
})();

// 为了向后兼容，保留 API_BASE_URL 常量
const API_BASE_URL = window.CONFIG.API_BASE_URL;

// 输出当前使用的配置和API地址（方便调试）
console.log('🔍 全局配置:', window.CONFIG);
console.log('📡 API Base URL:', API_BASE_URL);

// ===== 通用请求函数 =====
async function request(url, options = {}) {
    const config = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        ...options
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, config);
        const data = await response.json();

        // 后端统一返回格式：{ code, message, data }
        if (data.code === 200) {
            return { success: true, data: data.data, message: data.message };
        } else {
            return { success: false, error: data.message || '请求失败' };
        }
    } catch (error) {
        console.error('API Request Error:', error);
        return { 
            success: false, 
            error: error.message || '网络错误，请检查连接'
        };
    }
}

// ===== GET 请求 =====
async function get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return request(fullUrl, { method: 'GET' });
}

// ===== POST 请求 =====
async function post(url, data = {}) {
    return request(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// ===== PUT 请求 =====
async function put(url, data = {}) {
    return request(url, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

// ===== DELETE 请求 =====
async function del(url, data = {}) {
    return request(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// ===== 文件上传 =====
async function uploadFiles(files) {
    const formData = new FormData();
    
    if (Array.isArray(files)) {
        files.forEach(file => formData.append('files', file));
    } else {
        formData.append('file', files);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.code === 200) {
            return { success: true, urls: data.urls };
        } else {
            return { success: false, error: data.message || '上传失败' };
        }
    } catch (error) {
        console.error('Upload Error:', error);
        return { success: false, error: '上传失败，请重试' };
    }
}

// ===== API封装对象 =====
const API = {
    // 通用CRUD
    query(entity, params = {}) {
        return get(`/${entity}/query`, params);
    },

    create(entity, data) {
        return post(`/${entity}/create`, data);
    },

    update(entity, data) {
        return post(`/${entity}/update`, data);
    },

    delete(entity, data) {
        return post(`/${entity}/delete`, data);
    },

    // 奶茶店铺
    shop: {
        query(params) {
            return get('/shop/query', params);
        },
        create(data) {
            return post('/shop/create', data);
        },
        update(data) {
            return post('/shop/update', data);
        },
        delete(data) {
            return post('/shop/delete', data);
        }
    },

    // 美食商品
    convenience: {
        query(params) {
            return get('/convenience/query', params);
        },
        create(data) {
            return post('/convenience/create', data);
        },
        update(data) {
            return post('/convenience/update', data);
        },
        delete(data) {
            return post('/convenience/delete', data);
        }
    },

    // 出行交通
    travel: {
        query(params) {
            return get('/travel/query', params);
        },
        update(data) {
            return post('/travel/update', data);
        },
        modify(data) {
            return post('/travel/modify', data);
        },
        delete(data) {
            return post('/travel/delete', data);
        }
    },

    // 上传文件
    upload(files) {
        return uploadFiles(files);
    },

    // 版本信息
    version() {
        return get('/version');
    },

    // 健康检查
    health() {
        return get('/health');
    }
};

// ===== 请求拦截器示例（可扩展）=====
const RequestInterceptor = {
    onRequest(config) {
        // 可在此添加全局请求头、token等
        return config;
    },

    onResponse(response) {
        // 可在此统一处理响应
        return response;
    },

    onError(error) {
        // 可在此统一处理错误
        Toast.error(error.message || '请求失败');
        return Promise.reject(error);
    }
};
