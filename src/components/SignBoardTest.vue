<template>
  <div class="signboard">
    <div class="left">
      <div class="title">
        智能助手签名捺印测试
        <el-tooltip class="item" effect="dark" placement="bottom-end">
          <div slot="content">
            <p>如何使用</p>
            <div>
              1. 电脑开启 签名助手应用<br>
              2. 在签名消息日志一栏上输入链接地址，一般情况下是 <b>localhost:8899/RemoteESS</b><br>
              3. 点击登录<br>
              4. 登录成功后，选择连接签名板，点小飞机 发送指令<br>
              &nbsp;&nbsp;&nbsp;&nbsp;或者直接在左侧侧 <b>智能助手签名捺印测试</b> 选择连接，ip和端口默认不用填写<br>
              &nbsp;&nbsp;&nbsp;&nbsp;会自动读取签名助手客户端里面配置的ip端口<br>
              5. 可以开始其他指令操作<br>
            </div>
          </div>
          <i class="el-icon-question"></i>
        </el-tooltip>
      </div>
      <el-divider content-position="left">签名板连接状态</el-divider>
      <div class="connect-state">连接状态：{{ connectionState }}
        <el-button type="primary" style="margin-left: 16px" v-if="!signboard.connected" @click="connect"
                   :disabled="!wsConnected">连接
        </el-button>
        <el-button type="primary" style="margin-left: 16px" v-if="signboard.connected" @click="disconnect"
                   :disabled="!wsConnected">断开
        </el-button>
        <el-input style="width: 200px;margin-left: 24px" placeholder="签名板IP，默认不需要填写" v-model="signboard.ip"/>
        <el-input style="width: 200px;margin-left: 10px" placeholder="签名板端口，默认不需要填写"
                  v-model="signboard.port"/>
      </div>
      <el-divider content-position="left">签名和指纹</el-divider>
      <div class="image-wrap">
        <el-image class="image" :src="signboard.signPng" fit="contain">
          <div slot="error" class="image-slot">
            <i class="el-icon-picture-outline"></i>
          </div>
        </el-image>
        <el-image class="image" :src="signboard.signGif" fit="contain">
          <div slot="error" class="image-slot">
            <i class="el-icon-picture-outline"></i>
          </div>
        </el-image>
        <el-image class="image" :src="signboard.fingerPng" fit="contain">
          <div slot="error" class="image-slot">
            <i class="el-icon-picture-outline"></i>
          </div>
        </el-image>
      </div>
      <el-divider content-position="left">PDF签名捺印</el-divider>
      <div>
        <el-checkbox v-model="forceRead">强制阅读</el-checkbox>
        <el-checkbox v-model="modernMode">实景签</el-checkbox>
        <div class="inline-flex vertical-gap" style="margin-right: 16px">
          <div style="font-size: 14px">超时时间&nbsp;&nbsp;</div>
          <el-slider :min="0" :max="1200" :step="1" v-model="timeout" show-input
                     style="flex: 1; margin-left: 16px;margin-right: 16px" input-size="small"/>
        </div>
        <div class="upload-wrap">
          <el-upload
              ref="upload"
              class="upload"
              drag
              :action="action"
              accept=".pdf,.PDF"
              :before-upload="beforeFile"
              :on-change="change"
              :limit="1"
              :disabled="!signboard.connected"
              :auto-upload="false">
            <i class="el-icon-upload"></i>
            <div class="el-upload__text" v-if="signboard.connected">将pdf文件拖到此处，或<em>点击选择</em></div>
            <div class="el-upload__text" v-else>请先连接签名板</div>
            <div class="el-upload__tip" slot="tip"></div>
          </el-upload>
          <div class="upload-msg">{{ pdf }}<br>{{ pdfResult }}</div>
        </div>
      </div>
      <el-divider content-position="left">本地缓存目录</el-divider>
      <div>
        <el-input placeholder="请输入地址" v-model="cacheAddress" class="input-with-select" :disabled="!wsConnected">
          <el-button slot="append" @click="setCacheAddress" :disabled="!cacheAddress || !wsConnected">设置</el-button>
          <el-button slot="append" @click="getCacheAddress" :disabled="!wsConnected">读取</el-button>
        </el-input>
      </div>
    </div>
    <div class="right">
      <div class="title">
        签名消息日志
      </div>

      <WebSocketClient :address="address" :cmds="cmds" @message="message" ref="ws" @open="wsConnect" @close="wsClose"
                       :beforeSend="beforeSend"/>

    </div>
  </div>
</template>

<script>
import WebSocketClient from "@/components/WebSocketClient";
import {generateUUID} from "@/utils";

export default {
  name: 'SignAssistanceDemo',
  components: {
    WebSocketClient
  },
  data() {
    return {
      address: 'localhost:8899/ESS',
      wsConnected: false,
      pdfFile: null,
      pdfResult: '',
      forceRead: true,
      modernMode: true,
      timeout: 120,
      cacheAddress: '',
      cmds: [
        {label: '连接签名板', command: {"action": "open"}},
        {
          label: '断开签名板', command: {
            "action": "close",
            "exitProcess": false
          }
        },
        {label: '仅签名', command: {"action": "onlySign", "timeout": "66S"}},
        {label: '仅捺印', command: {"action": "onlyFinger", "timeout": "65S"}},
        {label: '签名捺印', command: {"action": "signFinger", "timeout": "123S"}},
        // {
        //   label: 'PDF签名捺印', command: {
        //     "action": "clickSignEx",
        //     "srcPdfUrl": "C:/Users/qinhui/Desktop/pdf/test.pdf",
        //     "dstPdfFilename": "SIGN_test.pdf"
        //   }
        // },
        {label: '查询状态', command: {"action": "devStatus"}},
        {label: '启动视频预览', command: {"action": "startVideo"}},
        {label: '关闭视频预览', command: {"action": "stopVideo"}},
        {
          label: '启动录制', command: {
            "action": "startRecord",
            // "recordName0": "录像1.mp4",
            // "recordName1": "录像2.mp4",
            // "recordName2": "录像3.mp4",
            // "recordName3": "录像4.mp4"
          }
        },
        {
          label: '停止录制', command: {
            "action": "stopRecord",
            "save": true,
            "uploadUrl": ""
          }
        },
        // {
        //   label: '设置本地存储路径', command: {
        //     "action": "setLocalDir",
        //     "dir": "D:/ESSCache/XSESS/customDir"
        //   }
        // },
        {
          label: '查询本地存储路径', command: {
            "action": "localDir"
          }
        },
      ],
      signboard: {
        connected: false,
        signPng: '',
        signGif: '',
        fingerPng: '',
      }
    }
  },
  computed: {
    connectionState() {
      return this.signboard.connected ? '已连接' : '未连接'
    },
    action() {
      return location.href
    },
    pdf() {
      return this.pdfFile && this.pdfFile.name
    }
  },
  mounted() {
    this.$refs.ws.open()
  },
  methods: {
    beforeSend(command) {
      const cmd = JSON.parse(command)
      cmd.reqId = generateUUID()
      return JSON.stringify(cmd)
    },
    wsConnect() {
      this.wsConnected = true
      this.getCacheAddress()
      this.connect()
    },
    wsClose() {
      this.wsConnected = false
      this.signboard.connected = false
    },
    beforeFile(file) {
      console.log(`beforeFile ${file}`)
    },
    change(file) {
      console.log(file)
      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        this.$message.error('上传的签名文件不能大于10M')
        return false
      }
      this.pdfFile = file
      if (!this.fileReader) {
        this.fileReader = new FileReader()
      }
      const that = this
      this.fileReader.onload = function () {
        const base64 = this.result.replace('data:application/pdf;base64,', '')
        const command = {
          "action": "clickSignEx",
          "dstPdfFilename": file.name,
          "srcPdfBase64": base64,
          "forceReadAll": that.forceRead,
          "enableRealityScene": that.modernMode,
          "timeout": `${that.timeout}S`
        }
        that.$refs.ws.setAndSendMessage(JSON.stringify(command))
        that.$refs.upload.clearFiles()
      }
      this.fileReader.readAsDataURL(file.raw)
    },
    connect() {
      // 这里可以指定签名板 地址 如 {"action":"open","ip":"192.168.1.111","port":45008} ，详见协议文档
      // 如不指定，则默认采用 签名助手 配置的地址
      const command = {"action": "open"}
      if (this.signboard.ip && this.signboard.port) {
        command.ip = this.signboard.ip
        command.port = this.signboard.port
      }
      this.$refs.ws.setAndSendMessage(JSON.stringify(command))
    },
    disconnect() {
      const command = {"action": "close", "exitProcess": false}
      this.$refs.ws.setAndSendMessage(JSON.stringify(command))
    },
    setCacheAddress() {
      if (!this.cacheAddress) {
        this.$message.warning('请输入文件路径')
        return
      }
      // 组装命令
      const command = {
        "action": "setLocalDir",
        "dir": this.cacheAddress
      }
      // 发送命令
      this.$refs.ws.setAndSendMessage(JSON.stringify(command))
    },
    getCacheAddress() {
      // 组装命令
      const command = {"action": "localDir"}
      this.$refs.ws.setAndSendMessage(JSON.stringify(command))
    },
    // 消息解析
    message(msg) {
      const message = JSON.parse(msg)
      if (message?.code !== 0) {
        this.$message.error(message?.message ?? '未知错误')
        return
      }
      const {action, data} = message
      switch (action) {
        case "open":
          this.signboard.connected = true
          break
        case "close":
          this.signboard.connected = false
          break
        case "signOK": {
          const signInfo = data.signFingerData ? data.signFingerData[0]?.signInfo : null
          signInfo && (this.signboard.signPng = 'data:image/*;base64,' + signInfo.signPngData)
          signInfo && (this.signboard.signGif = 'data:image/*;base64,' + signInfo.signGifData)
          break
        }
        case "fingerOK":
          this.signboard.fingerPng = 'data:image/*;base64,' + data.signFingerData[0].fingerInfo.fingerData
          break
        case "signFingerOK": {
          // 展示签名和指纹
          const signFingerData = data.signFingerData ?? []
          signFingerData.forEach((e) => {
            const {signInfo, fingerInfo} = e
            signInfo && (this.signboard.signPng = 'data:image/*;base64,' + signInfo.signPngData)
            signInfo && (this.signboard.signGif = 'data:image/*;base64,' + signInfo.signGifData)
            fingerInfo && (this.signboard.fingerPng = 'data:image/*;base64,' + fingerInfo.fingerData)
          })
          break
        }
        case "localDir":
          this.cacheAddress = data.dir
          break
        case "pdfSignFingerOK": {
          // 展示签名和指纹
          const signFingerData = data.signFingerData ?? []
          signFingerData.forEach((e) => {
            const {signInfo, fingerInfo} = e
            signInfo && (this.signboard.signPng = 'data:image/*;base64,' + signInfo.signPngData)
            signInfo && (this.signboard.signGif = 'data:image/*;base64,' + signInfo.signGifData)
            fingerInfo && (this.signboard.fingerPng = 'data:image/*;base64,' + fingerInfo.fingerData)
          })
          this.pdfResult = `签名文件缓存文件地址：${data.pdfUrl}`
          // 签名pdf文件处理 这里做了下载，按实际需求处理
          const signedPdfBase64 = 'data:application/pdf;base64,' + data.pdfData
          const pdfUrl = data.pdfUrl
          const filename = pdfUrl.substring(pdfUrl.lastIndexOf('/') + 1)
          fetch(signedPdfBase64).then(async (res) => {
            const blob = await res.blob()
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl
            link.download = filename
            link.click()
            URL.revokeObjectURL(blobUrl)
          }).catch((error) => {
            this.$message.error(error)
            console.error(error)
          })
        }
          break
      }
      this.$message.success(message)
    }
  }
}
</script>

<style scoped>
.signboard {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: row;
  box-sizing: border-box;
  color: #606266;
}

.title {
  width: 100%;
  color: #606266;
  font-size: 30px;
  text-align: center;
  margin-bottom: 12px;
}

.left {
  flex: 3;
  padding: 16px;
}

.right {
  flex: 2;
  padding: 16px;
  border: solid 1px #eee;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.connect-state {
  display: inline;
}

.image-wrap {
  display: grid;
  grid-gap: 8px;
  grid-template-columns: 200px 200px 200px 200px 200px;
  grid-template-rows: 200px;
}

.image {
  border: solid 1px #eeeeee;
  max-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-wrap {
  width: 100%;
  display: flex;
  flex-direction: row;
  margin-top: 8px;
}

.upload-msg {
  margin-left: 16px;
}

.image-slot {

}

.vertical-gap {
  margin-top: 8px;
}

.inline-flex {
  display: flex;
  align-items: center;
  flex-direction: row;
}
</style>
