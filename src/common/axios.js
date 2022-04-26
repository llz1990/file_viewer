import axios from 'axios'

// 创建axios实例
let service =  axios.create({
  withCredentials: true,
  baseURL: '', // api的base_url
  timeout: 60000 // 请求超时时间
})
// request拦截器
service.interceptors.request.use(config => {
  return config
}, error => {
  Promise.reject(error)
})

// respone拦截器
service.interceptors.response.use(
  response => {
    if(response.status === 200) {
      return response;
    } else {
      return Promise.reject('error');
    }
  },
  error => {
    return Promise.reject(error)
  }
)

export default service
