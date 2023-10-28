export function copyToClipboard(text) {
    return new Promise((resolve, reject) => {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text)
        }
        try {
            // 获取要复制的文本内容
            const textToCopy = text;
            // 创建临时textarea元素
            const tempTextarea = document.createElement("textarea");
            tempTextarea.value = textToCopy;
            document.body.appendChild(tempTextarea);
            // 选择临时textarea元素中的文本
            tempTextarea.select();
            // 复制选择的文本到剪贴板中
            document.execCommand("copy");
            // 删除临时textarea元素
            document.body.removeChild(tempTextarea);
            resolve()
        } catch (e) {
            reject(e)
        }
    })
}

export function generateUUID() {
    // 生成随机的十六进制数字
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}
