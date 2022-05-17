<template>
  <div :class="{ hidden }">
    <div class="banner">
      <div class="container">
        <h1>
          <div>
            文档查阅器
            <input
              class="file-select"
              type="file"
              @change="handleChange"
            />
          </div>
        </h1>
      </div>
    </div>
    <div class="container">
      <div
        v-show="loading"
        class="well loading"
      ><span style="font-size: 14px">正在加载中，请耐心等待...</span></div>
      <div
        v-show="!loading"
        class="well"
        ref="output"
      ></div>
    </div>
  </div>
</template>

<script>
import { getExtend, readBuffer, render } from "@/common/util";
import { parse } from "qs";
import request from "@/common/axios";

/**
 * 支持嵌入式显示，基于postMessage支持跨域
 * 示例代码：
 *
 */
export default {
  name: "Home",
  props: {
    msg: String,
  },
  data() {
    return {
      // 加载状态跟踪
      loading: false,
      // 上个渲染实例
      last: null,
      // 隐藏头部，当基于消息机制渲染，将隐藏
      hidden: false,
    };
  },
  created() {
    // --------------------- 1.直接传二进制数据过来进行处理 -----------------------
    // 允许使用预留的消息机制发送二进制数据，必须在url后添加?name=xxx.xxx&from=xxx
    // form 数据来源是二进制数据
    // const { from, name } = parse(location.search.substr(1));
    // if (from) {
    //   this.hidden = true; // 如果是通过外来二进制打开，隐藏头部
    //   window.addEventListener("message", (event) => {
    //     const { origin, data: blob } = event;
    //     console.log("二进制file ==============>", blob);
    //     if (origin === from && blob instanceof Blob) {
    //       // 构造响应，自动渲染
    //       const file = new File([blob], name, {});
    //       this.handleChange({ target: { files: [file] } });
    //     }
    //   });
    // }
    // ---------- 2.传指定文件的URL路径转成blob二进制进行处理过来进行处理 ----------
    // 测试链接：https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fhbimg.b0.upaiyun.com%2F8138b202eb5c505b4e46159b2642477205c6b42c14bb5-FWbB38_fw658&refer=http%3A%2F%2Fhbimg.b0.upaiyun.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1628928976&t=5e9f3b7f70c32cc17f87500920124a75
    // 测试链接：http://localhost:8900/img/pic.png
    // 测试链接：http://iobs.pingan.com.cn/download/laip-life-baishitongaskbob-dmz-prd/20485b22884e4923ac11ca01a927cb62?attname=5f5f91db-b905-4119-b2b2-3020431ed867.PDF
    let { from, name } = this.$route.query; // 取路由参数
    const that = this;
    // 如果接收到 URL 参数携带文件信息，则直接渲染：
    if (from && name) {
      this.hidden = true; // 如果是通过外来二进制打开，隐藏头部
      const url = from;
      console.log("url ==============>", url);
      fetch(url, {
        mode: "cors",
      })
        .then((response) => {
          console.log("response ===============>", response);
          return response.blob();
        })
        .then(function (blob) {
          if (blob instanceof Blob) {
            console.log("blob ==================>", blob, name, from);
            // 构造响应，自动渲染
            const file = new File([blob], name, {});
            that.handleChange({ target: { files: [file] } });
          }
        });
    }

    // 3.通过axios 来处理代理地址
    // let { from, name } = this.getParamsQuery();
    // const that = this;
    // if (from) {
    //   window.addEventListener("message", (event) => {
    //     return request({
    //       url: from,
    //       method: "get",
    //       responseType: "blob", // 响应参数变成blob
    //     }).then(function (data) {
    //       let blob = data.data;
    //       if (blob instanceof Blob) {
    //         console.log("blob ==================>", blob, name, from);
    //         // 构造响应，自动渲染
    //         const file = new File([blob], name, {});
    //         that.handleChange({ target: { files: [file] } });
    //       }
    //     });
    //   });
    // }
  },
  methods: {
    // 本地上传文件的处理
    async handleChange(e) {
      this.loading = true;
      try {
        const [file] = e.target.files;
        const arrayBuffer = await readBuffer(file);
        this.loading = false;
        this.last = await this.displayResult(arrayBuffer, file);
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
    displayResult(buffer, file) {
      // 取得文件名
      const { name } = file;
      // 取得扩展名
      const extend = getExtend(name);
      // 输出目的地
      const { output } = this.$refs;
      // 生成新的dom
      const node = document.createElement("div");
      // 防止vue实例替换dom元素
      if (this.last) {
        output.removeChild(this.last.$el);
        this.last.$destroy();
      }
      const child = output.appendChild(node);
      // 调用渲染方法进行渲染
      return new Promise((resolve, reject) =>
        render(buffer, extend, child).then(resolve).catch(reject)
      );
    },

    urlToBase64(url) {
      return new Promise((resolve, reject) => {
        let image = new Image();
        // CORS 策略，会存在跨域问题https://stackoverflow.com/questions/20424279/canvas-todataurl-securityerror
        image.setAttribute("crossOrigin", "Anonymous");
        image.src = url;
        image.onload = function () {
          let canvas = document.createElement("canvas");
          canvas.width = this.naturalWidth;
          canvas.height = this.naturalHeight;
          // 将图片插入画布并开始绘制
          canvas.getContext("2d").drawImage(image, 0, 0);
          // result
          let result = canvas.toDataURL("image/png");
          resolve(result);
        };

        // 图片加载失败的错误处理
        image.onerror = () => {
          reject(new Error("图片流异常"));
        };
      });
    },

    /**
     * 下载文件
     * blob 二进制数据流
     */
    downloadFile(blob, name) {
      const downloadURL = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = downloadURL;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadURL);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.banner {
  overflow: auto;
  text-align: center;
  /* background-color: #12b6ff; */
  color: #000;
}

.hidden .banner {
  display: none;
}

.hidden .well {
  height: calc(100vh - 12px);
}

.file-select {
  position: absolute;
  left: 5%;
  top: 17px;
  margin-left: 20px;
}

.banner div {
  color: #000;
}

.banner h1 {
  font-size: 20px;
  line-height: 2;
  margin: 0.5em 0;
}

.well {
  display: block;
  background-color: #f2f2f2;
  border: 1px solid #ccc;
  margin: 5px;
  width: calc(100% - 12px);
  height: calc(100vh - 73px);
  overflow: auto;
}

.loading {
  text-align: center;
  padding-top: 50px;
}

.messages .warning {
  color: #cc6600;
}
</style>

<style>
.pptx-wrapper {
  max-width: 1000px;
  margin: 0 auto;
}
</style>
