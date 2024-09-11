const URL_PARAMS = new URLSearchParams(window.location.search);

async function getActiveTab() {
    // Open popup.html?tab=5 to use tab ID 5, etc.
    if (URL_PARAMS.has("tab")) {
        return parseInt(URL_PARAMS.get("tab"));
    }

    const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    return tabs[0].id; // Return the tab ID
}

// document.getElementById('fetchBtn1').addEventListener('click', async () => {
//     const activeTabId = await getActiveTab();

//     chrome.runtime.sendMessage({ action: 'fetchData', tabId: activeTabId }, (response) => {
//         if (!response) {
//             console.error('No response received from background script');
//             return;
//         } else if (response.error) {
//             console.log(response.error);
//         } else {
//             console.log('Data received from background:', response.data);
//         }
//     });
// });

document.getElementById('fetchBtn').addEventListener('click', async () => {
    // Save the value 1 to Chrome's storage
    chrome.storage.sync.set({ savedValue: 1 }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error saving to storage:', chrome.runtime.lastError);
        } else {
            console.log('Value 1 has been saved to storage');
        }
    });
});



'use strict';

// ========= common.js =========


const isDebug = false
const isFirefox = inArray("Firefox", navigator.userAgent)
const B = {
    getBackgroundPage: chrome.extension.getBackgroundPage,
    id: chrome.runtime.id,
    onMessage: chrome.runtime.onMessage,
    sendMessage: chrome.runtime.sendMessage,
    error: chrome.runtime.lastError,
    storage: chrome.storage,
    browserAction: chrome.browserAction,
    contextMenus: chrome.contextMenus,
    notifications: chrome.notifications,
    tabs: chrome.tabs,
    tts: chrome.tts,
}

function storageLocalGet(options) {
    return storage('local', 'get', options)
}

function storageLocalSet(options) {
    return storage('local', 'set', options)
}

function storage(type, method, options) {
    return new Promise((resolve, reject) => {
        if (!isFirefox) {
            let callback = function (r) {
                let err = B.error
                err ? reject(err) : resolve(r)
            }
            let api = type === 'sync' ? B.storage.sync : B.storage.local
            if (method === 'get') {
                api.get(options, callback)
            } else if (method === 'set') {
                api.set(options, callback)
            }
        } else {
            let api = isDebug ? browser.storage.local : type === 'sync' ? browser.storage.sync : browser.storage.local
            if (method === 'get') {
                api.get(options).then(r => resolve(r), err => reject(err))
            } else if (method === 'set') {
                api.set(options).then(r => resolve(r), err => reject(err))
            }
        }
    })
}

function sendMessage(message) {
    return new Promise((resolve, reject) => {
        if (!isFirefox) {
            B.sendMessage(message, r => B.error ? reject(B.error) : resolve(r))
        } else {
            browser.runtime.sendMessage(message).then(r => resolve(r), err => reject(err))
        }
    })
}

function sendTabMessage(tabId, message) {
    return new Promise((resolve, reject) => {
        if (!isFirefox) {
            // B.tabs.sendMessage(tabId, message, r => B.error ? reject(B.error) : resolve(r))
            tabId && B.tabs.sendMessage(tabId, message)
        } else {
            // browser.tabs.sendMessage(tabId, message).then(r => resolve(r)).catch(err => reject(err))
            tabId && browser.tabs.sendMessage(tabId, message).catch(err => debug('send error:', err))
        }
        resolve()
    })
}

function getActiveTabId() {
    return new Promise((resolve, reject) => {
        if (!isFirefox) {
            B.tabs.query({currentWindow: true, active: true}, tab => {
                let tabId = tab[0] && tab[0].url && resolve(tab[0].id)
                resolve(tabId)
            })
        } else {
            browser.tabs.query({currentWindow: true, active: true}).then(tab => {
                let tabId = tab[0] && resolve(tab[0].id)
                resolve(tabId)
            }, err => reject(err))
        }
    })
}

// 获得所有语音的列表 (firefox 不支持)
function getVoices() {
    return new Promise((resolve, reject) => {
        if (!B.tts || !B.tts.getVoices) return reject("I won't support it!")

        B.tts.getVoices(function (voices) {
            let list = {}
            for (let i = 0; i < voices.length; i++) {
                let v = voices[i]
                // debug('Voice:', i, JSON.stringify(v))
                let {lang, voiceName, remote} = v
                if (!list[lang]) list[lang] = []
                list[lang].push({lang, voiceName, remote})
            }
            resolve(list)
        })
    })
}

function inArray(val, arr) {
    return arr.indexOf(val) !== -1
    // return arr.includes(val)
}

function httpGet(url, type, headers) {
    return new Promise((resolve, reject) => {
        let c = new XMLHttpRequest()
        c.responseType = type || 'text'
        c.timeout = 30000
        c.onload = function (e) {
            if (this.status === 200) {
                resolve(this.response)
            } else {
                reject(e)
            }
        }
        c.ontimeout = function (e) {
            reject('NETWORK_TIMEOUT', e)
        }
        c.onerror = function (e) {
            reject('NETWORK_ERROR', e)
        }
        c.open("GET", url)
        headers && headers.forEach(v => {
            c.setRequestHeader(v.name, v.value)
        })
        c.send()
    })
}

function httpPost(options) {
    let o = Object.assign({
        url: '',
        responseType: 'json',
        type: 'form',
        body: null,
        timeout: 30000,
        headers: [],
    }, options)
    return new Promise((resolve, reject) => {
        let c = new XMLHttpRequest()
        c.responseType = o.responseType
        c.timeout = o.timeout
        c.onload = function (e) {
            if (this.status === 200 && this.response !== null) {
                resolve(this.response)
            } else {
                reject(e)
            }
        }
        c.ontimeout = function (e) {
            reject('NETWORK_TIMEOUT', e)
        }
        c.onerror = function (e) {
            reject('NETWORK_ERROR', e)
        }
        c.open("POST", o.url)
        if (o.type === 'form') {
            c.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
        } else if (o.type === 'json') {
            c.setRequestHeader("Content-Type", "application/json; charset=UTF-8")
        } else if (o.type === 'xml') {
            c.setRequestHeader("Content-Type", "application/ssml+xml")
        }
        o.headers.length > 0 && o.headers.forEach(v => {
            c.setRequestHeader(v.name, v.value)
        })
        c.send(o.body)
    })
}

// 判断字符串中是否有文字，主要未过滤全符号字符串
function hasWords(s) {
    return /[a-zA-Z\d]/.test(s) || /\p{Unified_Ideograph}/u.test(s)
}

function debug(...data) {
    isDebug && console.log('[DEBUG]', ...data)
}


// ============ popup.js ============

let setting = {}; // Local copy of settings
let langList = {}, speakList = [{ key: '', val: '默认' }];

let speak_voice = $('speak_voice');
let speak_play = $('speak_play');
let speak_pause = $('speak_pause');
let speak_stop = $('speak_stop');

document.addEventListener('DOMContentLoaded', async function () {
    // Request initial settings from the background
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        setting = response.setting || {};
        initializeUI(); // Initialize the UI once settings are received
    });

    // Fetch and generate speech list
    let pushSpeak = function (obj, name) {
        for (let [key, val] of Object.entries(obj)) speakList.push({ key: `${name}:${key}`, val });
    };

    await fetch('conf/speak.json').then(r => r.json()).then(r => {
        r.baidu && pushSpeak(r.baidu, 'baidu');
        r.baiduAi && pushSpeak(r.baiduAi, 'baiduAi');
        r.youdao && pushSpeak(r.youdao, 'youdao');
        r.sogou && pushSpeak(r.sogou, 'sogou');
        r.google && pushSpeak(r.google, 'google');
    });

    // if (!isFirefox) {
    //     await fetch('conf/language.json').then(r => r.json()).then(r => langList = r);

    //     let voiceObj = {};
    //     await getVoices().then(r => voiceObj = r);
    //     for (const [key, val] of Object.entries(voiceObj)) {
    //         let langName = langList[key] ? langList[key].zhName : key;
    //         val.forEach(v => speakList.push({
    //             key: `local:${key}:${v.voiceName}`,
    //             val: `${langName} | ${v.voiceName}${v.remote ? ' | 远程' : ''}`
    //         }));
    //     }
    // }

    setTimeout(initVoiceSelect, 10);

    // Event handlers for buttons
    speak_play.onclick = function () {
        speak_pause.innerText = '暂停朗读';
        getActiveTabId().then(tabId => sendTabMessage(tabId, { action: 'speakStart' }));
        removeSpeakHost();
    };

    speak_pause.onclick = function () {
        if (this.innerText === '暂停朗读') {
            speak_pause.innerText = '恢复朗读';
            chrome.runtime.sendMessage({ action: 'pauseSpeech' });
        } else {
            speak_pause.innerText = '暂停朗读';
            chrome.runtime.sendMessage({ action: 'resumeSpeech' });
        }
    };

    speak_stop.onclick = function () {
        speak_pause.innerText = '暂停朗读';
        chrome.runtime.sendMessage({ action: 'stopSpeech' });
        removeSpeakHost();
    };
});

// Initialize the voice selection dropdown
function initVoiceSelect() {
    speak_voice.innerText = ''; // Clear the dropdown
    speakList.forEach(v => {
        if (setting.speakLang && !inArray(setting.speakLang, v.val)) return; // Exclude other languages
        let el = document.createElement('option');
        el.value = v.key;
        el.innerText = v.val;
        speak_voice.appendChild(el);
    });

    // Set initial selection
    if (setting.speakName && speak_voice.querySelector(`option[value="${setting.speakName}"]`)) {
        speak_voice.value = setting.speakName;
    } else {
        let firstEl = speak_voice.querySelector(`option`);
        if (firstEl) firstEl.click();
    }
}

// Initialize UI elements with settings and bind events
function initializeUI() {
    A('select[name],input[name="limitWords"]').forEach(el => {
        let name = el.getAttribute('name');
        if (!setting.limitWords) setting.limitWords = 200;
        if (setting[name]) el.value = setting[name];
        el.onchange = function () {
            let val = this.value;
            if (name === 'limitWords' && (isNaN(Number(val)) || val < 100)) {
                val = 100;
                this.value = val;
            }
            setSetting(name, val);
            if (name === 'speakLang') initVoiceSelect();
        };
    });

    A('input[type=checkbox][name]').forEach(el => {
        let name = el.getAttribute('name');
        if (setting[name]) el.checked = setting[name];
        el.onclick = function () {
            setSetting(name, this.checked);
        };
    });
}

// Clear auto-speak host records
function removeSpeakHost() {
    chrome.storage.local.set({ autoSpeakHost: '' });
}

// Update settings in local storage
function setSetting(key, value) {
    setting[key] = value;
    chrome.storage.local.set({ setting });

    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        setting = response.setting || {};
        console.log('Settings updated:', setting);
        // initializeUI(); // Initialize the UI once settings are received
    });
}

// Utility functions
function $(id) {
    return document.getElementById(id);
}

function A(s) {
    return document.querySelectorAll(s);
}
