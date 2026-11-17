# 本机普通话朗读

共享控制器从生产基线 e5efc43 的 `portal/travel/hunan/src/speech.js` 迁移，保留 `localMandarinVoices`、`speechChunks`、`createSpeechController` 和 `xiangxing-speech-v1` 格式。

仅在浏览器挂载之后调用 `createSpeechController`，页面提供既有 speech voice/rate/preview/status 元素。返回 `speak`、`stop`，新增 `destroy`，组件卸载时必须调用，移除 voiceschanged 与控件事件并停止队列。

保留 iOS 首次点击内同步提交完整语句队列、非活动状态不无条件 cancel、本机音色优先以及可操作错误提示。没有新增远程 TTS 或系统设置操作。WebKit 模拟通过不等于真实 iOS 设备声音验证。
