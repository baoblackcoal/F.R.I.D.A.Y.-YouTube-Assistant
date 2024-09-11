"use strict";

console.log("connected...");
const onInstallURL = "https://glasp.co/youtube-summary";

// On Chrome Install
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        // chrome.tabs.create({ url: onInstallURL });
    }
});

let prompt = "";

// On Message
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === "setPrompt") {
        prompt = request.prompt;
    } else if (request.message === "getPrompt") {
        sendResponse({ prompt: prompt });
        prompt = ""; // Reset prompt
    }

    if (request.action === 'fetchData') {
        // Perform some background tasks like fetching data from an API
        // fetch('https://api.example.com/data')
        fetch('https://www.example.com')
            .then((response) => response.json())
            .then((data) => {
                sendResponse({ data });
            })
            .catch((error) => {
                sendResponse({ error: error.message });
            });
        return true; // Will respond asynchronously
    }
});


//=================== tts =========================
//-------- common.js --------

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
            B.tabs.query({ currentWindow: true, active: true }, tab => {
                let tabId = tab[0] && tab[0].url && resolve(tab[0].id)
                resolve(tabId)
            })
        } else {
            browser.tabs.query({ currentWindow: true, active: true }).then(tab => {
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
                let { lang, voiceName, remote } = v
                if (!list[lang]) list[lang] = []
                list[lang].push({ lang, voiceName, remote })
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


//  ----- background.js -----



var setting = {}, speakObj = {}, playOptions = {}
let audio = new Audio()
document.addEventListener('DOMContentLoaded', async function () {
    await storageLocalGet(['setting']).then(r => {
        setting = r.setting || {} // 设置信息
    })

    await fetch('conf/speak.json').then(r => r.json()).then(r => {
        speakObj = r // 朗读配置
    })
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getSettings') {
        chrome.storage.local.get('setting', (result) => {
            sendResponse({ setting: result.setting || {} });
            setting = result.setting || {} // 设置信息
        });

        fetch('conf/speak.json').then(r => r.json()).then(r => {
            speakObj = r // 朗读配置
        })

        return true; // Keeps the message channel open for sendResponse
    } else if (message.action === 'pauseSpeech') {
        speakPause(); // Your function to pause speech
    } else if (message.action === 'resumeSpeech') {
        speakResume(); // Your function to resume speech
    } else if (message.action === 'stopSpeech') {
        speakStop(); // Your function to stop speech
    }
});



// 添加上下文菜单
// Create the context menu item without the onclick parameter
chrome.contextMenus.create({
    id: 'readAloud',  // Unique id for the menu item
    title: '朗读“%s”', // The title of the menu item
    contexts: ['selection']  // Contexts in which the menu item will appear
});

// Add an event listener for the onClicked event
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'readAloud') {  // Check if the clicked menu item is 'readAloud'
        speakPlay(info.selectionText)
            .then(() => {
                setBrowserAction('');
            })
            .catch(err => {
                debug('speak error:', err);
                notifications('朗读出错', '右键朗读出错');
            });
    }
});




// 监听消息
chrome.runtime.onMessage.addListener(function (m, sender, sendResponse) {
    // debug('sender', sender)
    debug(sender.tab ? `from: ${sender.tab.url}` : `from extensions`)
    debug('request', m)
    sendResponse('received')
    if (!sender.tab) return
    let tabId = sender.tab.id
    if (m.action === 'speak') {
        speakPlay(m.text).then(() => {
            sendTabMessage(tabId, { action: 'speak' })
            setBrowserAction('')
        }).catch(err => {
            debug('speak error:', err)
            notifications('朗读出错', '朗读小说出错')
        })
    } else if (m.action === 'scribbleSpeak') {
        speakPlay(m.text).then(() => {
            setBrowserAction('')
        }).catch(err => {
            debug('speak error:', err)
            notifications('朗读出错', '划词朗读出错')
        })
    }
})

function debug(a, b) {
    console.log(a, b)
}

// 通知
function notifications(title, message) {
    B.notifications.create('readerNotification', {
        "type": "basic",
        "iconUrl": '128.png',
        "title": title,
        "message": message
    })
}

// 开始朗读
function speakPlay(text) {
    // console.log(text)
    playOptions.status = 'speak'
    let speakName = setting.speakName
    if (!speakName) speakName = isFirefox ? 'baidu:zh' : 'local'
    let [type, lang, voiceName] = speakName.split(':')
    playOptions.type = type
    setBrowserAction('读')
    if (type === 'local') {
        return localTTS(text, lang, voiceName)
    } else if (type === 'baidu') {
        return bauduTTS(text, lang)
    } else if (type === 'baiduAi') {
        return baiduAiTTS(text, lang)
    } else if (type === 'google') {
        return googleTTS(text, lang)
    } else if (type === 'youdao') {
        return youdaoTTS(text, lang)
    } else if (type === 'sogou') {
        return sogouTTS(text, lang + ':' + voiceName)
    } else {
        return Promise.reject('tts type error: ' + type)
    }
}

// 暂停朗读
function speakPause() {
    playOptions.status = 'pause'
    playOptions.type === 'local' ? B.tts.pause() : audio.pause()
    setBrowserAction('')
}

// 恢复朗读
function speakResume() {
    playOptions.status = 'speak'
    playOptions.type === 'local' ? B.tts.resume() : audio.play()
}

// 停止朗读
function speakStop() {
    playOptions.status = 'stop'
    !isFirefox && B.tts.stop()
    audio.pause()
    audio.currentTime = 0
    window.queuePlayTime = 0 // 停止队列中的执行
    setBrowserAction('')
}

function localTTS(text, lang, voiceName) {
    return new Promise((resolve, reject) => {
        B.tts.isSpeaking(function (isSpeaking) {
            if (isSpeaking) B.tts.stop()

            let options = {}
            if (lang) options.lang = lang
            if (voiceName) options.voiceName = voiceName
            if (setting.rate) options.rate = Number(setting.rate)
            if (setting.pitch) options.pitch = Number(setting.pitch)
            // console.log(options)
            let arr = sliceStr(text, 128)
            let lastKey = arr.length - 1
            arr.forEach((v, k) => {
                debug(k, v)
                options.onEvent = function (e) {
                    // ((e, k) => {
                    // debug('onEvent:', e)
                    if (e.type === 'end') {
                        debug('end:', k, lastKey)
                        if (k === lastKey) {
                            resolve()
                        }
                    } else if (e.type === 'error') {
                        debug('speak error:', e.errorMessage)
                        reject(e.errorMessage)
                    }
                    // })(e, k)
                }
                if (k === 0) {
                    B.tts.speak(v, options)
                } else {
                    B.tts.speak(v, Object.assign({ enqueue: true }, options))
                }
            })
        })
    })
}

function bauduTTS(text, lang) {
    return new Promise((resolve, reject) => {
        if (!inArray(lang, Object.keys(speakObj.baidu))) return reject(`bauduTTS: This "${lang}" language is not supported!`)
        let getUrl = (s) => {
            // 备用 https://tts.baidu.com/text2audio?tex=%E6%98%8E(ming2)%E7%99%BD(bai2)&cuid=baike&lan=ZH&ctp=1&pdt=31&vol=9&spd=4&per=4100
            return `https://fanyi.baidu.com/gettts?lan=${lang}&text=${encodeURIComponent(s)}&spd=3&source=web`
        }
        let arr = []
        let textArr = sliceStr(text, 128)
        textArr.forEach(s => {
            arr.push(getUrl(s))
        })
        queuePlay(arr).then(r => resolve(r)).catch(err => reject(err))
    })
}

function baiduAiTTS(text, per) {
    per = per.replace(/^zh-/g, '')
    // see https://ai.baidu.com/ai-doc/SPEECH/Qk38y8lrl
    // pit	选填	音调，取值0-15，默认为5中语调
    let pit = 5
    let pitArr = {
        '0.5': 0,
        '0.75': 3,
        '1': 5,
        '1.25': 7,
        '1.5': 10,
        '1.75': 12,
        '2': 15,
    }
    let pk = setting.pitch
    if (pk && pitArr[pk]) pit = pitArr[pk]

    return new Promise(async (resolve, reject) => {
        window.queuePlayTime = Date.now()
        let t = JSON.parse(JSON.stringify(window.queuePlayTime))
        let arr = sliceStr(text, 128)
        for (let tex of arr) {
            let err = false
            let errMsg = null
            let delay = 500
            for (let i = 0; i < 20; i++) {
                if (playOptions.status !== 'speak') return // 终止执行
                if (window.queuePlayTime !== t) return // 终止执行
                let data = ''

                let url = `https://tts.baidu.com/text2audio?tex=${tex}&cuid=baidu_speech_demo&lan=ZH&ctp=1&pdt=301&vol=9&rate=32&per=${per}&pit=${pit}`
                await httpGet(url, 'blob').then(r => {
                    // if (r.msg === 'success') data = r.data
                    data = r

                    err = false
                    errMsg = null
                }).catch(e => {
                    err = true
                    errMsg = e
                })

                /*await httpPost({
                    // url: `https://ai.baidu.com/aidemo`,
                    // body: `type=tns&spd=5&pit=5&vol=5&per=${per}&tex=${tex}&aue=6`,
                    url: `https://tts.baidu.com/text2audio`,
                    // body: `tex=${tex}&per=${per}&cuid=baidu_speech_demo&lan=zh&ctp=1&pdt=1&pit=5&spd=5`,
                    // body: `tex=${tex}&per=${per}&cuid=baike&lan=zh&ctp=1&pdt=301&pit=${pit}&spd=5`,
                    body: `tex=${tex}&spd=5&per=${per}&cuid=baidu_speech_demo&idx=1&cod=2&lan=zh&ctp=1&pdt=301&vol=5&pit=${pit}&_res_tag_=audio`,
                    responseType: 'blob'
                }).then(r => {
                    // if (r.msg === 'success') data = r.data
                    data = r

                    err = false
                    errMsg = null
                }).catch(e => {
                    err = true
                    errMsg = e
                })*/

                if (!err) {
                    await playAudio(data).then(() => {
                        err = false
                        errMsg = null
                    }).catch(e => {
                        err = true
                        errMsg = e
                    })
                }
                if (!err) break
                await sleep(delay) // 延迟重试
                delay *= 2 // 双倍延迟
            }
            if (err) return reject(errMsg) // 重试播放全部失败，就终止播放 (大约 145 小时)
        }
        resolve() // 播放完成
    })
}

function googleTTS(text, lang) {
    return new Promise((resolve, reject) => {
        if (!inArray(lang, Object.keys(speakObj.google))) return reject(`googleTTS: This "${lang}" language is not supported!`)
        let getUrl = (s) => {
            return `https://translate.googleapis.com/translate_tts?client=gtx&tl=${lang}&ie=UTF-8&q=` + encodeURIComponent(s)
        }
        let arr = []
        let textArr = sliceStr(text, 128)
        textArr.forEach(s => {
            arr.push(getUrl(s))
        })
        queuePlay(arr).then(r => resolve(r)).catch(err => reject(err))
    })
}

function youdaoTTS(text, lang) {
    return new Promise((resolve, reject) => {
        if (!inArray(lang, Object.keys(speakObj.youdao))) return reject(`youdaoTTS: This "${lang}" language is not supported!`)
        let getUrl = (s) => {
            // 备用 http://tts.youdao.com/fanyivoice?word=${encodeURIComponent(q)}&le=eng&keyfrom=speaker-target
            return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(s)}&le=${lang}`
        }
        let arr = []
        let textArr = sliceStr(text, 128)
        textArr.forEach(s => {
            arr.push(getUrl(s))
        })
        queuePlay(arr).then(r => resolve(r)).catch(err => reject(err))
    })
}

function sogouTTS(text, lang) {
    return new Promise((resolve, reject) => {
        if (!inArray(lang, Object.keys(speakObj.sogou))) return reject(`sogouTTS: This "${lang}" language is not supported!`)
        let getUrl = (s) => {
            let [lan, name] = lang.split(':')
            if (inArray(lan, ['zh-CHS', 'en'])) {
                return `https://fanyi.sogou.com/reventondc/synthesis?text=${encodeURIComponent(s)}&speed=1&lang=${lan}&from=translateweb&speaker=${name || 1}`
            } else {
                return `https://fanyi.sogou.com/reventondc/microsoftGetSpeakFile?text=${encodeURIComponent(s)}&spokenDialect=${lan}&from=translateweb`
            }
        }
        let arr = []
        let textArr = sliceStr(text, 128)
        textArr.forEach(s => {
            arr.push(getUrl(s))
        })
        queuePlay(arr).then(r => resolve(r)).catch(err => reject(err))
    })
}

function queuePlay(arr) {
    return new Promise(async (resolve, reject) => {
        window.queuePlayTime = Date.now()
        let t = JSON.parse(JSON.stringify(window.queuePlayTime))
        for (let url of arr) {
            // console.log('url:', url)
            let err = false
            let errMsg = null
            let delay = 500
            for (let i = 0; i < 20; i++) {
                if (playOptions.status !== 'speak') return // 终止执行
                if (window.queuePlayTime !== t) return // 终止执行
                await playAudio(i === 0 ? url : url + '&t=' + Date.now()).then(() => {
                    err = false
                    errMsg = null
                }).catch(e => {
                    err = true
                    errMsg = e
                })
                if (!err) break
                await sleep(delay) // 延迟重试
                delay *= 2 // 双倍延迟
            }
            if (err) return reject(errMsg) // 重试播放全部失败，就终止播放 (大约 145 小时)
        }
        resolve()
    })
}

function playAudio(url) {
    return new Promise((resolve, reject) => {
        let blobUrl = null
        if (typeof url === 'string') {
            audio.src = url
        } else if (typeof url === 'object') {
            blobUrl = URL.createObjectURL(url)
            audio.src = blobUrl
        } else {
            return reject('Audio url error:', url)
        }
        audio.onended = function () {
            if (blobUrl) URL.revokeObjectURL(blobUrl) // 释放内存
            resolve()
        }
        audio.onerror = function (err) {
            reject(err)
        }
        if (setting.rate) audio.playbackRate = Number(setting.rate) // 播放速度
        let playPromise = audio.play()
        if (playPromise !== undefined) {
            playPromise.catch(_ => {
                resolve() // 播放失败，跳过播放
            })
        }
    })
}

function sleep(delay) {
    return new Promise(r => setTimeout(r, delay))
}

function setBrowserAction(text) {
    chrome.action.setBadgeText({ text: text || '' })
    chrome.action.setBadgeBackgroundColor({ color: 'red' })
    isFirefox && chrome.action.setBadgeTextColor({ color: 'white' })
}

// 分隔字符串
function sliceStr(text, maxLen) {
    let r = []
    if (text.length <= maxLen) {
        r.push(text)
    } else {
        // 根据优先级截取字符串，详细符号见：https://zh.wikipedia.org/wiki/%E6%A0%87%E7%82%B9%E7%AC%A6%E5%8F%B7
        let separators = `！？。；－－＿～﹏，：/、·`
        separators += `!?.;-…,"`
        separators += `“”﹃﹄「」﹁﹂『』﹃﹄（）［］〔〕【】《》〈〉()[]{}`
        let separatorArr = [...separators]
        let arr = text.split('\n')
        arr.forEach(s => {
            s = s.trim()
            if (!s) return

            if (s.length <= maxLen) {
                r.push(s)
            } else {
                do {
                    if (s.length <= maxLen) {
                        r.push(s)
                        break
                    }
                    let end = false
                    for (let i = 0; i < separatorArr.length; i++) {
                        if (i + 1 === separatorArr.length) end = true
                        let symbol = separatorArr[i]
                        let n = s.indexOf(symbol)
                        if (n === -1) continue
                        if (n > maxLen) continue
                        let s2 = s.substring(0, n).trim()
                        s2 && r.push(s2)
                        s = s.substring(n + 1).trim()
                        break
                    }
                    if (!end) continue
                    if (!s) break
                    if (s.length <= maxLen) {
                        r.push(s)
                        break
                    }

                    let s1 = s.substring(0, maxLen)
                    let s2 = s.substring(maxLen)
                    let n = s1.lastIndexOf(' ')
                    if (n !== -1) {
                        // 处理英文
                        let s3 = s1.substring(0, n)
                        let s4 = s1.substring(n)
                        r.push(s3)
                        s = (s4 + s2).trim()
                    } else {
                        // 没有空格，就硬切（这种情况一般是中文）
                        r.push(s1)
                        s = s2
                    }
                } while (s)
            }
        })
    }
    return r
}
